import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

// Import our subcomponents
import ParticlesUniverse from "./ParticlesUniverse";
import NeuralCore from "./NeuralCore";
import FloatingCards from "./FloatingCards";
import DataTunnel from "./DataTunnel";
import NeuralNetwork from "./NeuralNetwork";
import AIBrain from "./AIBrain";
import AuroraShader from "./AuroraShader";

interface ImmersiveCanvasProps {
  scrollProgressRef: React.RefObject<number>;
}

// Camera Controller Component to dynamically animate viewport parameters per section
function CameraController({ scrollProgressRef }: { scrollProgressRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Determine target camera positions based on scroll narrative progress inside useFrame
    if (scrollProgress < 1.0) {
      // SECTION 1: Arrival
      targetPos.current.set(0, 0, 5.2);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 1.0 && scrollProgress < 2.0) {
      // SECTION 2: Materialization
      targetPos.current.set(0, 0, 4.8);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 2.0 && scrollProgress < 3.0) {
      // SECTION 3: Antigravity Floating Cards
      targetPos.current.set(0, 0.2, 5.8);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 3.0 && scrollProgress < 4.0) {
      // SECTION 4: Data Tunnel Fly-through
      const tProgress = scrollProgress - 3.0; // 0 -> 1
      targetPos.current.set(0, 0, 5.0 - tProgress * 18.0);
      targetLookAt.current.set(0, 0, -25);
    } else if (scrollProgress >= 4.0 && scrollProgress < 5.0) {
      // SECTION 5: Product Breakdown (Exploded View)
      const bProgress = scrollProgress - 4.0; // 0 -> 1
      targetPos.current.set(
        THREE.MathUtils.lerp(0, 0.8, bProgress),
        THREE.MathUtils.lerp(0, 0.5, bProgress),
        THREE.MathUtils.lerp(-13, 3.8, bProgress)
      );
      targetLookAt.current.set(0, 0.1, 0);
    } else if (scrollProgress >= 5.0 && scrollProgress < 6.0) {
      // SECTION 6: Performance Reveal
      targetPos.current.set(0, 0, 3.2);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 6.0 && scrollProgress < 7.0) {
      // SECTION 7: Neural Network
      targetPos.current.set(0, 0.3, 5.2);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 7.0 && scrollProgress < 8.0) {
      // SECTION 8: AI Brain
      targetPos.current.set(0, 0, 4.2);
      targetLookAt.current.set(0, 0, 0);
    } else if (scrollProgress >= 8.0 && scrollProgress < 9.0) {
      // SECTION 9: Ecosystem Reveal
      targetPos.current.set(0, 0.5, 7.8);
      targetLookAt.current.set(0, 0, 0);
    } else {
      // SECTION 10: Final CTA
      targetPos.current.set(0, 0, 5.2);
      targetLookAt.current.set(0, 0, 0);
    }

    // Smoothly interpolate camera position
    camera.position.lerp(targetPos.current, 0.065);
    
    // Smoothly interpolate camera target direction
    const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    const lerpedLookAt = currentLookAt.lerp(targetLookAt.current, 0.065);
    camera.lookAt(lerpedLookAt);

    // Subtle breathing motion of the camera
    const time = state.clock.getElapsedTime();
    camera.position.y += Math.sin(time * 0.8) * 0.0015;
    camera.position.x += Math.cos(time * 0.5) * 0.001;
  });

  return null;
}

export default function ImmersiveCanvas({ scrollProgressRef }: ImmersiveCanvasProps) {
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-black">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        {/* Force pure black background inside the WebGL context */}
        <color attach="background" args={["#000000"]} />

        {/* Cinematic Lighting System */}
        <ambientLight intensity={0.12} />
        
        {/* Soft gold key light */}
        <directionalLight
          position={[5, 5, 4]}
          intensity={1.5}
          color="#e5c158"
        />
        
        {/* Bronze rim light for edge shine */}
        <directionalLight
          position={[-5, -2, -3]}
          intensity={1.2}
          color="#d97706"
        />

        {/* Dynamic camera transitions */}
        <CameraController scrollProgressRef={scrollProgressRef} />

        {/* Scene Layers */}
        <AuroraShader scrollProgressRef={scrollProgressRef} />
        <ParticlesUniverse scrollProgressRef={scrollProgressRef} />
        <NeuralCore scrollProgressRef={scrollProgressRef} />
        <FloatingCards scrollProgressRef={scrollProgressRef} />
        <DataTunnel scrollProgressRef={scrollProgressRef} />
        <NeuralNetwork scrollProgressRef={scrollProgressRef} />
        <AIBrain scrollProgressRef={scrollProgressRef} />
      </Canvas>
    </div>
  );
}
