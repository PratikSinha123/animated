import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DataTunnelProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function DataTunnel({ scrollProgressRef }: DataTunnelProps) {
  const tunnelRef = useRef<THREE.Group>(null);
  const ringGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  // Generate warp particles flying towards the camera
  const particleCount = 400;
  const [positions, speeds, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    const col = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color("#e5c158"), // Gold sand
      new THREE.Color("#d4af37"), // Metallic gold
      new THREE.Color("#d97706"), // Bronze/Amber
      new THREE.Color("#c5a059"), // Warm sand
    ];

    for (let i = 0; i < particleCount; i++) {
      // Position particles in a cylinder volume
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5; // radius inside tunnel
      
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = -Math.random() * 20.0; // depth along Z

      spd[i] = 4.0 + Math.random() * 6.0; // flight speed

      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, spd, col];
  }, []);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Visibility: active in Section 4 (3.0 -> 4.0)
    let visibility = 0;
    if (scrollProgress >= 2.8 && scrollProgress < 3.1) {
      visibility = (scrollProgress - 2.8) / 0.3; // scale/fade in
    } else if (scrollProgress >= 3.1 && scrollProgress < 3.9) {
      visibility = 1.0;
    } else if (scrollProgress >= 3.9 && scrollProgress < 4.4) {
      visibility = 1.0 - (scrollProgress - 3.9) / 0.5; // fade out
    }

    if (tunnelRef.current) {
      tunnelRef.current.visible = visibility > 0;
    }
    if (visibility === 0) return;
    const t = state.clock.getElapsedTime();

    // Scale and fade the tunnel group
    if (tunnelRef.current) {
      tunnelRef.current.scale.setScalar(
        THREE.MathUtils.lerp(tunnelRef.current.scale.x, visibility * 1.2, 0.08)
      );
      // Slow spin
      tunnelRef.current.rotation.z = t * 0.05;
    }

    // Scroll tunnel rings towards camera (Z position)
    if (ringGroupRef.current) {
      const rings = ringGroupRef.current.children;
      rings.forEach((ring, index) => {
        // Scroll along Z from -20 to 5
        let zPos = ring.position.z + 0.05 + (scrollProgress - 3.0) * 0.2;
        if (zPos > 5) {
          zPos = -20; // wrap around
        }
        ring.position.z = zPos;
        // Pulse ring radius
        const scaleVal = 1.0 + Math.sin(t * 2.0 + index) * 0.05;
        ring.scale.set(scaleVal, scaleVal, 1.0);

        // Modulate ring opacity
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0.45 * visibility;
      });
    }

    // Update tunnel warp particles
    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry;
      const posArr = geometry.attributes.position.array as Float32Array;
      const scrollFactor = (scrollProgress - 3.0) * 12.0;

      for (let i = 0; i < particleCount; i++) {
        // Move particle towards camera (increasing Z)
        let z = posArr[i * 3 + 2];
        z += speeds[i] * 0.015 + scrollFactor * 0.01;
        
        // Loop particles when they get past the camera (Z > 2)
        if (z > 2.0) {
          z = -20.0; // reset to back of tunnel
        }
        posArr[i * 3 + 2] = z;
      }
      geometry.attributes.position.needsUpdate = true;

      // Modulate particle material opacity
      (particlesRef.current.material as THREE.PointsMaterial).opacity = 0.8 * visibility;
    }

    // Modulate cylinder opacities
    if (outerMeshRef.current) {
      (outerMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 * visibility;
    }
    if (innerMeshRef.current) {
      (innerMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 * visibility;
    }

    // Modulate light intensities
    if (light1Ref.current) light1Ref.current.intensity = 10 * visibility;
    if (light2Ref.current) light2Ref.current.intensity = 10 * visibility;
  });

  return (
    <group ref={tunnelRef}>
      {/* 1. Main wireframe outer cylinder */}
      <mesh ref={outerMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.0, 25, 32, 12, true]} />
        <meshBasicMaterial
          color="#d97706"
          wireframe
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Inner glowing cylinder with sand grid */}
      <mesh ref={innerMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.9, 1.9, 25, 16, 6, true]} />
        <meshBasicMaterial
          color="#c5a059"
          wireframe
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Volumetric glowing circular rings spacing out the tunnel */}
      <group ref={ringGroupRef}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[0, 0, -2 * i - 2]} rotation={[0, 0, 0]}>
            <torusGeometry args={[1.8, 0.015, 8, 48]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#d4af37" : "#e5c158"}
              transparent
              opacity={0.45}
            />
          </mesh>
        ))}
      </group>

      {/* 4. Warp Speed Starfield / Data Stream Particles */}
      <points ref={particlesRef}>
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
      
      {/* Dynamic tunnel lighting */}
      <pointLight ref={light1Ref} position={[0, 0, -5]} intensity={0} color="#e5c158" distance={10} />
      <pointLight ref={light2Ref} position={[0, 0, -15]} intensity={0} color="#d97706" distance={10} />
    </group>
  );
}
