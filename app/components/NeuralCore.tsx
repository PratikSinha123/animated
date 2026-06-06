import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface NeuralCoreProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function NeuralCore({ scrollProgressRef }: NeuralCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const topRingRef = useRef<THREE.Mesh>(null);
  
  // Layer refs for animating exploded view
  const layer1Ref = useRef<THREE.Group>(null); // Core Engine (Bottom)
  const layer2Ref = useRef<THREE.Group>(null); // AI Layer (Middle-Bottom)
  const layer3Ref = useRef<THREE.Group>(null); // Security Layer (Middle-Top)
  const layer4Ref = useRef<THREE.Group>(null); // Infrastructure Layer (Top)

  // Explode progress and visibility calculations based on scroll progress ref
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const scrollProgress = scrollProgressRef.current || 0;

    // Visibility
    let coreVisibility = 0;
    if (scrollProgress >= 0.9 && scrollProgress < 1.5) {
      coreVisibility = (scrollProgress - 0.9) / 0.6;
    } else if (scrollProgress >= 1.5 && scrollProgress < 6.2) {
      coreVisibility = 1;
    } else if (scrollProgress >= 6.2 && scrollProgress < 7.0) {
      coreVisibility = 1.0 - (scrollProgress - 6.2) / 0.8;
    }

    // Explode progress
    let explodeProgress = 0;
    if (scrollProgress >= 4.0 && scrollProgress <= 5.0) {
      explodeProgress = scrollProgress - 4.0;
    } else if (scrollProgress > 5.0) {
      explodeProgress = 1.0;
    }

    // Rotate the overall core
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15 + scrollProgress * 0.2;
      groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.1;
      
      const targetScale = coreVisibility * 1.2;
      groupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.08)
      );
    }

    // Apply exploded offsets along the Y axis
    const maxExplodeOffset = 1.3;
    const lerpedExplode = explodeProgress;

    if (layer1Ref.current) {
      layer1Ref.current.position.y = THREE.MathUtils.lerp(
        layer1Ref.current.position.y,
        -maxExplodeOffset * 1.1 * lerpedExplode,
        0.08
      );
      layer1Ref.current.rotation.y = -t * 0.2;
    }
    
    if (layer2Ref.current) {
      layer2Ref.current.position.y = THREE.MathUtils.lerp(
        layer2Ref.current.position.y,
        -maxExplodeOffset * 0.35 * lerpedExplode,
        0.08
      );
      layer2Ref.current.rotation.y = t * 0.1;
    }
    
    if (layer3Ref.current) {
      layer3Ref.current.position.y = THREE.MathUtils.lerp(
        layer3Ref.current.position.y,
        maxExplodeOffset * 0.35 * lerpedExplode,
        0.08
      );
      layer3Ref.current.rotation.y = -t * 0.15;
    }
    
    if (layer4Ref.current) {
      layer4Ref.current.position.y = THREE.MathUtils.lerp(
        layer4Ref.current.position.y,
        maxExplodeOffset * 1.1 * lerpedExplode,
        0.08
      );
      layer4Ref.current.rotation.y = t * 0.3;
    }

    // Pulse the fiber optic indicator ring's opacity
    if (topRingRef.current) {
      const mat = topRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 + Math.sin(t * 5.0) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Volumetric Center Glow Light */}
      <pointLight distance={6} intensity={10} color="#d4af37" />
      
      {/* LAYER 1: Core Engine (Bottom) */}
      <group ref={layer1Ref}>
        {/* Base dark chrome ring */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
          <meshStandardMaterial
            color="#111111"
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        {/* Grid lines cylinder inside base */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[1.05, 1.05, 0.08, 32, 1, true]} />
          <meshBasicMaterial
            color="#c5a059"
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* LAYER 2: AI Layer (Middle-Bottom) */}
      <group ref={layer2Ref}>
        {/* Crystalline Glass Disk */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.35, 1.35, 0.06, 32]} />
          <meshPhysicalMaterial
            transparent
            transmission={0.9}
            opacity={1.0}
            roughness={0.05}
            ior={1.5}
            thickness={0.5}
            color="#d4af37"
          />
        </mesh>
        
        {/* Central glowing processor core */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <MeshDistortMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={3}
            speed={4}
            distort={0.4}
            radius={0.3}
          />
        </mesh>
      </group>

      {/* LAYER 3: Security Layer (Middle-Top) */}
      <group ref={layer3Ref}>
        {/* Outer shield wireframe orb */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[1.15, 16, 16]} />
          <meshBasicMaterial
            color="#d97706"
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
        
        {/* Rotating holographic rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.02, 8, 48]} />
          <meshBasicMaterial color="#b8860b" transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.85, 0.015, 8, 48]} />
          <meshBasicMaterial color="#c5a059" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* LAYER 4: Infrastructure Layer (Top) */}
      <group ref={layer4Ref}>
        {/* Metallic top cover casing */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[1.1, 1.3, 0.08, 32]} />
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.2}
            metalness={0.95}
          />
        </mesh>
        
        {/* Fiber optic indicator ring */}
        <mesh ref={topRingRef} position={[0, 0.25, 0]}>
          <torusGeometry args={[1.0, 0.02, 8, 64]} />
          <meshBasicMaterial
            color="#e5c158"
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
}
