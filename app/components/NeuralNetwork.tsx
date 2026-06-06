import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NeuralNetworkProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function NeuralNetwork({ scrollProgressRef }: NeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  const nodeCount = 180;
  const maxDistance = 1.15; // Threshold for connections

  // Track mouse coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Initialize nodes
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(nodeCount * 3);
    const vel = new Float32Array(nodeCount * 3);
    const col = new Float32Array(nodeCount * 3);

    const palette = [
      new THREE.Color("#e5c158"), // Gold sand
      new THREE.Color("#d4af37"), // Metallic gold
      new THREE.Color("#d97706"), // Bronze/Amber
      new THREE.Color("#c5a059"), // Warm sand
    ];

    for (let i = 0; i < nodeCount; i++) {
      // Scattered inside a box
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      // Random velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Random colors from palette
      const color = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, vel, col];
  }, []);

  // Allocate buffer for lines (worst case connection density)
  const maxLineConnections = 800;
  const linePositions = useMemo(() => new Float32Array(maxLineConnections * 2 * 3), []);
  const lineColors = useMemo(() => new Float32Array(maxLineConnections * 2 * 3), []);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;

    // Visibility logic: Section 7 (6.0 -> 7.0)
    let visibility = 0;
    if (scrollProgress >= 5.8 && scrollProgress < 6.2) {
      visibility = (scrollProgress - 5.8) / 0.4; // Fade/scale in
    } else if (scrollProgress >= 6.2 && scrollProgress < 7.2) {
      visibility = 1.0;
    } else if (scrollProgress >= 7.2 && scrollProgress < 8.0) {
      visibility = 1.0 - (scrollProgress - 7.2) / 0.8; // Dissolve out/into brain
    }

    if (groupRef.current) {
      groupRef.current.visible = visibility > 0;
    }
    if (visibility === 0) return;
    const t = state.clock.getElapsedTime();

    const points = pointsRef.current;
    const lines = linesRef.current;
    if (!points || !lines) return;

    const posAttr = points.geometry.attributes.position;
    const posArr = posAttr.array as Float32Array;

    // Mouse coordinates mapped to 3D space
    const mouseX = mouseRef.current.x * 3.5;
    const mouseY = mouseRef.current.y * 2.0;

    // 1. Update node positions and apply velocities + mouse repel
    for (let i = 0; i < nodeCount; i++) {
      // Add drift/velocity
      posArr[i * 3] += velocities[i * 3];
      posArr[i * 3 + 1] += velocities[i * 3 + 1];
      posArr[i * 3 + 2] += velocities[i * 3 + 2];

      // Bounce off boundaries
      const borderX = 3.5;
      const borderY = 2.2;
      const borderZ = 2.5;

      if (Math.abs(posArr[i * 3]) > borderX) {
        velocities[i * 3] *= -1;
      }
      if (Math.abs(posArr[i * 3 + 1]) > borderY) {
        velocities[i * 3 + 1] *= -1;
      }
      if (Math.abs(posArr[i * 3 + 2]) > borderZ) {
        velocities[i * 3 + 2] *= -1;
      }

      // Mouse repel distortion
      const dx = posArr[i * 3] - mouseX;
      const dy = posArr[i * 3 + 1] - mouseY;
      const distToMouse = Math.hypot(dx, dy);
      
      if (distToMouse < 1.3) {
        const repelForce = (1.3 - distToMouse) * 0.025;
        posArr[i * 3] += (dx / distToMouse) * repelForce;
        posArr[i * 3 + 1] += (dy / distToMouse) * repelForce;
      }
    }
    posAttr.needsUpdate = true;

    // 2. Compute dynamic connection lines
    let lineIdx = 0;
    const linePosArr = lines.geometry.attributes.position.array as Float32Array;
    const lineColArr = lines.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (lineIdx >= maxLineConnections) break;

        const x1 = posArr[i * 3];
        const y1 = posArr[i * 3 + 1];
        const z1 = posArr[i * 3 + 2];

        const x2 = posArr[j * 3];
        const y2 = posArr[j * 3 + 1];
        const z2 = posArr[j * 3 + 2];

        const dist = Math.hypot(x1 - x2, y1 - y2, z1 - z2);

        if (dist < maxDistance) {
          // Connect node i and node j
          const writeOffset = lineIdx * 6;

          // Positions
          linePosArr[writeOffset] = x1;
          linePosArr[writeOffset + 1] = y1;
          linePosArr[writeOffset + 2] = z1;
          linePosArr[writeOffset + 3] = x2;
          linePosArr[writeOffset + 4] = y2;
          linePosArr[writeOffset + 5] = z2;

          // Colors (fade lines that are farther apart)
          const lineAlpha = (1.0 - dist / maxDistance) * 0.45 * visibility;
          
          lineColArr[writeOffset] = colors[i * 3] * lineAlpha;
          lineColArr[writeOffset + 1] = colors[i * 3 + 1] * lineAlpha;
          lineColArr[writeOffset + 2] = colors[i * 3 + 2] * lineAlpha;
          
          lineColArr[writeOffset + 3] = colors[j * 3] * lineAlpha;
          lineColArr[writeOffset + 4] = colors[j * 3 + 1] * lineAlpha;
          lineColArr[writeOffset + 5] = colors[j * 3 + 2] * lineAlpha;

          lineIdx++;
        }
      }
    }

    // Set remaining elements to zero (hide them)
    const totalLineFloats = maxLineConnections * 6;
    for (let k = lineIdx * 6; k < totalLineFloats; k++) {
      linePosArr[k] = 0;
      lineColArr[k] = 0;
    }

    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.color.needsUpdate = true;

    // Apply scale and scroll rotation
    points.scale.setScalar(visibility * 1.25);
    lines.scale.setScalar(visibility * 1.25);

    points.rotation.y = t * 0.05 + scrollProgress * 0.15;
    lines.rotation.y = t * 0.05 + scrollProgress * 0.15;

    // Animate points material opacity
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.PointsMaterial).opacity = 0.85 * visibility;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dynamic line connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Nodes points */}
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
          size={0.08}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
