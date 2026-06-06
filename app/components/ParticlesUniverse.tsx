import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Shaders for the GPU particles
const vertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  uniform float uPulse;

  attribute vec3 aRandomPos;
  attribute vec3 aCorePos;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    
    // Mix position between random drift and core sphere
    vec3 mixedPos = mix(aRandomPos, aCorePos, uMorphProgress);
    
    // Ambient noise/drift in random mode
    float driftTime = uTime * 0.25;
    if (uMorphProgress < 0.99) {
      mixedPos.x += sin(driftTime + aRandomPos.y * 0.4) * 0.3 * (1.0 - uMorphProgress);
      mixedPos.y += cos(driftTime * 0.2 + aRandomPos.x * 0.5) * 0.15 * (1.0 - uMorphProgress);
      mixedPos.z += sin(driftTime * 0.15 + aRandomPos.x * 0.2) * 0.2 * (1.0 - uMorphProgress);
    }

    // Gentle rotation of the core as scroll progress advances
    if (uMorphProgress > 0.01) {
      float angle = uTime * 0.1 + uMorphProgress * 0.5;
      float s = sin(angle);
      float c = cos(angle);
      // Rotate around Y-axis
      float nx = mixedPos.x * c - mixedPos.z * s;
      float nz = mixedPos.x * s + mixedPos.z * c;
      mixedPos.x = mix(mixedPos.x, nx, uMorphProgress);
      mixedPos.z = mix(mixedPos.z, nz, uMorphProgress);
    }
    
    // Mouse Repel Physics
    vec3 mouse3D = vec3(uMouse.x * 7.0, uMouse.y * 4.0, 0.0);
    float dist = distance(mixedPos, mouse3D);
    if (dist < 2.5) {
      vec3 dir = normalize(mixedPos - mouse3D);
      float force = (2.5 - dist) * 0.35 * uMouseStrength;
      mixedPos += dir * force;
    }

    // Apply neural pulse effect when core is assembled (Section 2+)
    if (uMorphProgress > 0.5) {
      float distToCenter = length(mixedPos);
      float pulseForce = sin(distToCenter * 4.0 - uTime * 6.0) * 0.06 * uPulse * uMorphProgress;
      mixedPos += normalize(mixedPos) * pulseForce;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Attenuate size by distance
    gl_PointSize = aSize * (250.0 / -mvPosition.z);
    
    // Alpha transitions (fade out when zooming, etc.)
    vAlpha = smoothstep(10.0, 2.0, -mvPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Round smooth particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    // Soft radial edge
    float glow = smoothstep(0.5, 0.1, dist);
    gl_FragColor = vec4(vColor, glow * vAlpha * 0.75);
  }
`;

interface ParticlesUniverseProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function ParticlesUniverse({ scrollProgressRef }: ParticlesUniverseProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  const particleCount = 12000;

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Set up particle attributes
  const [randomPositions, corePositions, sizes, colors] = useMemo(() => {
    const randomPos = new Float32Array(particleCount * 3);
    const corePos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const col = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color("#e5c158"), // Gold sand
      new THREE.Color("#d4af37"), // Metallic gold
      new THREE.Color("#b8860b"), // Dark goldenrod
      new THREE.Color("#c5a059"), // Warm sand
      new THREE.Color("#f5deb3"), // Wheat
      new THREE.Color("#ffffff"), // Pure highlight white
    ];

    for (let i = 0; i < particleCount; i++) {
      // 1. Random Floating Position (scattered inside a large cube)
      randomPos[i * 3] = (Math.random() - 0.5) * 16;
      randomPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      randomPos[i * 3 + 2] = (Math.random() - 0.5) * 12;

      // 2. Core Sphere Position (Fibonacci lattice on sphere surface + noise)
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const radius = 1.6 + Math.random() * 0.15; // thin shell sphere

      corePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      corePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      corePos[i * 3 + 2] = radius * Math.cos(phi);

      // 3. Sizes
      sz[i] = Math.random() * 0.8 + 0.15;

      // 4. Color selection
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    return [randomPos, corePos, sz, col];
  }, []);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Morph progress calculation
    let morphProgress = 1.0;
    if (scrollProgress <= 1.0) {
      morphProgress = scrollProgress;
    } else if (scrollProgress >= 8.5) {
      morphProgress = Math.max(0, 1.0 - (scrollProgress - 8.5) * 0.7);
    }

    // Pulse strength calculation
    let pulseStrength = 0.5;
    if (scrollProgress >= 5.0 && scrollProgress <= 6.0) {
      pulseStrength = 1.5 + Math.sin((scrollProgress - 5.0) * Math.PI) * 2.5;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uMouse.value.lerp(mouseRef.current, 0.08);
      materialRef.current.uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uMorphProgress.value,
        morphProgress,
        0.05
      );
      materialRef.current.uniforms.uPulse.value = pulseStrength;
    }

    // Slowly rotate the entire point system group
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[randomPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandomPos"
          args={[randomPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-aCorePos"
          args={[corePositions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aColor"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uMorphProgress: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uMouseStrength: { value: 1.0 },
          uPulse: { value: 0.5 },
        }}
      />
    </points>
  );
}
