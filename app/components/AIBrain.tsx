import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AIBrainProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function AIBrain({ scrollProgressRef }: AIBrainProps) {
  const brainRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const light3Ref = useRef<THREE.PointLight>(null);

  const particleCount = 2000;

  // Procedural Brain Mesh Generation
  const [positions, colors, originalPositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const origPos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color("#c5a059"); // Warm sand
    const violet = new THREE.Color("#d4af37"); // Metallic gold
    const pink = new THREE.Color("#d97706"); // Bronze/Amber

    for (let i = 0; i < particleCount; i++) {
      // 1. Fibonacci lattice on a sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      let radius = 1.35;

      // 2. Shape into hemispheres (flatten slightly along the X axis near the center to create cleft)
      const rawX = radius * Math.sin(phi) * Math.cos(theta);
      const rawY = radius * Math.sin(phi) * Math.sin(theta);
      const rawZ = radius * Math.cos(phi);

      // Carve a sulcus (cleft) along the longitudinal fissure (Y-Z plane, X = 0)
      const xDistFromCenter = Math.abs(rawX);
      const sulcusDepth = 0.25 * Math.exp(-xDistFromCenter * 5.0);
      radius -= sulcusDepth;

      // Hemispherize: pull nodes slightly outward along X to separate the left and right halves
      const hemisphereOffset = rawX > 0 ? 0.08 : -0.08;
      
      // 3. Add organic folding (Gyri and Sulci folds)
      const foldFrequency = 8.0;
      const folds = Math.sin(rawX * foldFrequency) * 
                    Math.cos(rawY * foldFrequency) * 
                    Math.sin(rawZ * foldFrequency) * 0.12;
      radius += folds;

      // Calculate final coordinates
      const x = (radius * Math.sin(phi) * Math.cos(theta)) + hemisphereOffset;
      const y = (radius * Math.sin(phi) * Math.sin(theta)) * 1.15; // stretch vertically slightly
      const z = (radius * Math.cos(phi)) * 0.95; // compact front-to-back

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      origPos[i * 3] = x;
      origPos[i * 3 + 1] = y;
      origPos[i * 3 + 2] = z;

      // Color mapping: left hemisphere is cyan/blue, right is violet/pink
      const mixFactor = THREE.MathUtils.clamp((x + 0.5) / 1.0, 0, 1);
      const color = new THREE.Color().copy(cyan).lerp(violet, mixFactor);
      
      // Highlight some nodes with pink (synaptic triggers)
      if (Math.random() > 0.93) {
        color.copy(pink);
      }

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col, origPos];
  }, []);

  // Compute synaptic line paths inside the brain
  const lineCount = 300;
  const linePositions = useMemo(() => {
    const linePos = new Float32Array(lineCount * 2 * 3);
    let lineIdx = 0;

    // Connect randomly selected close nodes
    for (let i = 0; i < lineCount; i++) {
      const idx1 = Math.floor(Math.random() * particleCount);
      let idx2 = Math.floor(Math.random() * particleCount);

      // Find another node
      const p1 = new THREE.Vector3(positions[idx1*3], positions[idx1*3+1], positions[idx1*3+2]);
      
      // Select nearest node
      let minDist = 999;
      let targetIdx = idx2;

      for (let attempt = 0; attempt < 25; attempt++) {
        const testIdx = Math.floor(Math.random() * particleCount);
        if (testIdx === idx1) continue;
        const pTest = new THREE.Vector3(positions[testIdx*3], positions[testIdx*3+1], positions[testIdx*3+2]);
        const dist = p1.distanceTo(pTest);
        if (dist < minDist && dist < 0.6) {
          minDist = dist;
          targetIdx = testIdx;
        }
      }

      const offset = lineIdx * 6;
      linePos[offset] = positions[idx1 * 3];
      linePos[offset + 1] = positions[idx1 * 3 + 1];
      linePos[offset + 2] = positions[idx1 * 3 + 2];

      linePos[offset + 3] = positions[targetIdx * 3];
      linePos[offset + 4] = positions[targetIdx * 3 + 1];
      linePos[offset + 5] = positions[targetIdx * 3 + 2];

      lineIdx++;
    }
    return linePos;
  }, [positions]);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Visibility logic: Section 8 (7.0 -> 8.0)
    let visibility = 0;
    if (scrollProgress >= 6.8 && scrollProgress < 7.2) {
      visibility = (scrollProgress - 6.8) / 0.4; // Fade/scale in
    } else if (scrollProgress >= 7.2 && scrollProgress < 8.5) {
      visibility = 1.0;
    } else if (scrollProgress >= 8.5 && scrollProgress < 9.2) {
      visibility = 1.0 - (scrollProgress - 8.5) / 0.7; // Fade/scale out
    }

    if (brainRef.current) {
      brainRef.current.visible = visibility > 0;
    }
    if (visibility === 0) return;
    const t = state.clock.getElapsedTime();

    // Pulse/breathing effect of the brain lobes
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const posArr = geometry.attributes.position.array as Float32Array;

      // Brain learns / activates: breathing amplitude increases with scroll
      const learnFactor = (scrollProgress - 7.0); // 0 -> 1
      const pulseSpeed = 2.5 + learnFactor * 2.0;
      const pulseAmp = 0.035 + learnFactor * 0.05;

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Pulsate nodes along their normalized direction vectors
        const dirX = ox;
        const dirY = oy;
        const dirZ = oz;
        const len = Math.hypot(dirX, dirY, dirZ);

        // Breathe rhythm
        const wave = Math.sin(t * pulseSpeed + (ox + oy + oz) * 1.5) * pulseAmp;

        posArr[i * 3] = ox + (dirX / len) * wave;
        posArr[i * 3 + 1] = oy + (dirY / len) * wave;
        posArr[i * 3 + 2] = oz + (dirZ / len) * wave;
      }
      geometry.attributes.position.needsUpdate = true;
    }

    // Spin and tilt the brain group
    if (brainRef.current) {
      brainRef.current.rotation.y = t * 0.15;
      brainRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
      
      const scaleScalar = visibility * 1.25;
      brainRef.current.scale.setScalar(
        THREE.MathUtils.lerp(brainRef.current.scale.x, scaleScalar, 0.08)
      );
    }

    // Modulate lighting intensities
    if (light1Ref.current) light1Ref.current.intensity = 8 * visibility;
    if (light2Ref.current) light2Ref.current.intensity = 4 * visibility;
    if (light3Ref.current) light3Ref.current.intensity = 4 * visibility;

    // Modulate materials opacities
    if (linesRef.current) {
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = 0.15 * visibility;
    }
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.PointsMaterial).opacity = 0.8 * visibility;
    }
  });

  return (
    <group ref={brainRef}>
      {/* Volumetric core lighting inside the brain hemispheres */}
      <pointLight ref={light1Ref} intensity={0} color="#d4af37" distance={5} />
      <pointLight ref={light2Ref} position={[0.5, 0, 0]} intensity={0} color="#c5a059" distance={3} />
      <pointLight ref={light3Ref} position={[-0.5, 0, 0]} intensity={0} color="#d97706" distance={3} />

      {/* Brain outline connection segments */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#d4af37"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Brain node particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
