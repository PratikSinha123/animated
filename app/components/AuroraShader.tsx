import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Custom vertex shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Custom fragment shader for flowing aurora
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uScrollProgress;
  varying vec2 vUv;

  // 2D noise helper functions
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;

    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));

    return dot(n, vec3(70.0));
  }

  float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
      f += w * noise(p);
      p *= 2.0;
      w *= 0.5;
    }
    return f;
  }

  void main() {
    // Center coordinates
    vec2 uv = vUv;
    
    // Scale and warp coordinates based on time and scroll
    vec2 p = uv * 3.0;
    float timeScale = uTime * 0.15;
    float scrollScale = uScrollProgress * 0.2;

    // First layer of noise (slow large waves)
    float n1 = fbm(p + vec2(timeScale, -timeScale * 0.5));
    
    // Warp coordinates with first noise layer
    vec2 q = p + vec2(n1 + timeScale * 0.2, n1 - timeScale * 0.1);
    
    // Second layer of noise (turbulent detailing)
    float n2 = fbm(q + vec2(-timeScale * 0.3, timeScale * 0.2 + scrollScale));
    
    // Combine layers to create density map
    float density = smoothstep(-0.3, 0.7, n2 * 0.5 + n1 * 0.5);

    // Dynamic colors
    vec3 baseAmber = vec3(0.06, 0.035, 0.015);
    vec3 warmGold = vec3(0.42, 0.28, 0.07);
    vec3 sandBeige = vec3(0.38, 0.29, 0.16);
    vec3 bronzeOrange = vec3(0.48, 0.20, 0.04);

    // Mix colors based on position and noise
    vec3 color = baseAmber;
    
    // Add gold peaks
    color = mix(color, warmGold, smoothstep(0.1, 0.9, n1 * 0.5 + 0.5));
    
    // Add sand bands
    color = mix(color, sandBeige, smoothstep(0.2, 0.8, n2 * 0.5 + 0.5) * 0.8);
    
    // Add bronze glow modulated by scroll progress (aurora flares up in the end)
    float bronzeMix = smoothstep(0.3, 0.95, density) * (0.3 + 0.7 * smoothstep(7.0, 10.0, uScrollProgress));
    color = mix(color, bronzeOrange, bronzeMix);

    // Apply volumetric lighting feel (fade out towards screen edges)
    float edgeFade = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
    color *= edgeFade * 1.5;

    // Add ambient darkness (pure black background base)
    color += vec3(0.01);

    // Modulate brightness based on scroll progress to transition between dark space and glowing aurora
    float brightness = smoothstep(0.0, 3.0, uScrollProgress) * 0.2 + smoothstep(7.0, 10.0, uScrollProgress) * 0.8;
    gl_FragColor = vec4(color * brightness, 1.0);
  }
`;

interface AuroraShaderProps {
  scrollProgressRef: React.RefObject<number>;
}

export default function AuroraShader({ scrollProgressRef }: AuroraShaderProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    const scrollProgress = scrollProgressRef.current || 0;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uScrollProgress.value = scrollProgress;
    }
  });

  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        depthTest={false}
        uniforms={{
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        }}
      />
    </mesh>
  );
}
