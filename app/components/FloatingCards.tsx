import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BarChart3, Brain, ShieldAlert, Cpu } from "lucide-react";

interface FloatingCardsProps {
  scrollProgressRef: React.RefObject<number>;
}

interface CardData {
  title: string;
  icon: React.ReactNode;
  desc: string;
  metric: string;
  color: string;
  glowClass: string;
  initialPos: [number, number, number];
}

export default function FloatingCards({ scrollProgressRef }: FloatingCardsProps) {
  const cardsRef = useRef<THREE.Group>(null);

  const cardsData: CardData[] = useMemo(() => [
    {
      title: "Real-time Analytics",
      icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
      desc: "Instant query processing across globally distributed database clusters.",
      metric: "+148.2% throughput",
      color: "border-cyan-500/30",
      glowClass: "from-cyan-500/20 to-transparent",
      initialPos: [-2.2, 1.1, 0.2],
    },
    {
      title: "Antigravity AI",
      icon: <Brain className="w-5 h-5 text-violet-400" />,
      desc: "Autonomous neural routing executing over 250M parameters in real-time.",
      metric: "99.98% Accuracy",
      color: "border-violet-500/30",
      glowClass: "from-violet-500/20 to-transparent",
      initialPos: [2.2, 0.8, -0.3],
    },
    {
      title: "Edge Nodes",
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      desc: "Micro-virtualization layers routing requests with sub-millisecond overhead.",
      metric: "<12ms Edge response",
      color: "border-emerald-500/30",
      glowClass: "from-emerald-500/20 to-transparent",
      initialPos: [-2.0, -1.0, -0.4],
    },
    {
      title: "Holographic Guard",
      icon: <ShieldAlert className="w-5 h-5 text-indigo-400" />,
      desc: "Zero-trust verification pathways analyzing packets dynamically.",
      metric: "Active / Zero leaks",
      color: "border-indigo-500/30",
      glowClass: "from-indigo-500/20 to-transparent",
      initialPos: [2.0, -0.9, 0.4],
    },
  ], []);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Visibility control: Section 3 (2.0 -> 3.0)
    let visibility = 0;
    if (scrollProgress >= 1.7 && scrollProgress < 2.0) {
      visibility = (scrollProgress - 1.7) / 0.3; // scale in
    } else if (scrollProgress >= 2.0 && scrollProgress < 3.0) {
      visibility = 1;
    } else if (scrollProgress >= 3.0 && scrollProgress < 3.8) {
      visibility = 1.0 - (scrollProgress - 3.0) / 0.8; // scale out / fly away
    }

    if (!cardsRef.current) return;

    // Set visibility property on the group
    cardsRef.current.visible = visibility > 0;
    if (visibility === 0) return;

    // Z translation factor for the fly-by effect in Section 4
    let flyOffset = 0;
    if (scrollProgress >= 3.0) {
      flyOffset = (scrollProgress - 3.0) * 8.0;
    }

    const t = state.clock.getElapsedTime();
    const children = cardsRef.current.children;
    const mx = state.pointer.x; // Mouse X (-1 to 1)
    const my = state.pointer.y; // Mouse Y (-1 to 1)

    // Set overall group position and scale
    cardsRef.current.scale.setScalar(
      THREE.MathUtils.lerp(cardsRef.current.scale.x, visibility, 0.08)
    );

    cardsData.forEach((card, i) => {
      const mesh = children[i] as THREE.Group;
      if (!mesh) return;

      // 1. Natural floating (bobbing) effect using time offsets
      const floatX = Math.sin(t * 1.2 + i * 2) * 0.15;
      const floatY = Math.cos(t * 0.9 + i * 3) * 0.15;
      const floatZ = Math.sin(t * 1.5 + i * 1.5) * 0.1;

      // 2. Cursor repulsion physics
      const mouse3DX = mx * 3.5;
      const mouse3DY = my * 2.0;
      
      const targetPos = new THREE.Vector3(
        card.initialPos[0] + floatX,
        card.initialPos[1] + floatY,
        card.initialPos[2] + floatZ + (card.initialPos[2] > 0 ? flyOffset : -flyOffset) // fly past camera on Z
      );

      const distToMouse = Math.hypot(targetPos.x - mouse3DX, targetPos.y - mouse3DY);
      if (distToMouse < 2.0) {
        // Calculate repel vector (push card away from cursor)
        const repelDirX = targetPos.x - mouse3DX;
        const repelDirY = targetPos.y - mouse3DY;
        const repelStrength = (2.0 - distToMouse) * 0.5;
        
        targetPos.x += repelDirX * repelStrength;
        targetPos.y += repelDirY * repelStrength;
        targetPos.z += repelStrength * 0.3; // Push card closer to camera
      }

      // Smoothly interpolate positions
      mesh.position.lerp(targetPos, 0.08);

      // 3. Cursor tilt effect (3D card rotation)
      const tiltX = (my - (mesh.position.y / 3)) * 0.25;
      const tiltY = -(mx - (mesh.position.x / 5)) * 0.25;
      
      mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, tiltX, 0.08);
      mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, tiltY + Math.sin(t * 0.3 + i) * 0.05, 0.08);
      mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, Math.cos(t * 0.2) * 0.02, 0.08);
    });
  });

  return (
    <group ref={cardsRef}>
      {cardsData.map((card, i) => (
        <group key={i} position={card.initialPos}>
          <Html
            transform
            distanceFactor={2.5}
            portal={{ current: document.body }}
            className="w-72 p-6 glass-card rounded-2xl select-none"
            style={{
              transition: "transform 0.1s ease-out",
            }}
          >
            {/* Background Glow Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.glowClass} rounded-2xl opacity-20 pointer-events-none`} />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-gray-300 font-display font-medium tracking-wide">
                {card.title}
              </span>
              <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                {card.icon}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 leading-relaxed mb-5 relative z-10">
              {card.desc}
            </p>

            {/* Metric Footer */}
            <div className={`pt-4 border-t ${card.color} flex justify-between items-center relative z-10`}>
              <span className="text-xs text-gray-500 uppercase tracking-widest">
                Metric
              </span>
              <span className="text-xs font-semibold text-white bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                {card.metric}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
