import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * HeroLightning — fullscreen animated shader gradient behind hero.
 * Flowing yellow→amber→coral plasma. Mouse-reactive parallax.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  varying vec2 vUv;

  // Hash & noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Normalize — центр UV
    vec2 uv = vUv;
    float ar = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);

    // Mouse parallax (−0.06..+0.06)
    vec2 mouseOffset = (uMouse - 0.5) * 0.12;
    p += mouseOffset;

    // Glow origin shifted UP — sits behind the ⚡ icon, NOT on the text below
    // In p-space: y+ = up. 0.28 = upper-center, above the big headline.
    float d = length(p - vec2(0.0, 0.28));

    // Tighter radial — focused halo, not a screen-filling flood
    // smoothstep(0.52, 0.0, d): full at center, zero by radius ~0.52
    float radial = smoothstep(0.52, 0.0, d);

    // Flow: fbm noise slowly moves
    float t = uTime * 0.06;
    float n1 = fbm(p * 1.8 + vec2(t, t * 0.7));
    float n2 = fbm(p * 3.2 - vec2(t * 0.4, t * 1.1));
    float n = mix(n1, n2, 0.5);

    // Full original intensity — beautiful, not dimmed
    float intensity = radial * (0.35 + n * 0.85);

    // Palette: yellow → amber → coral
    vec3 yellow = vec3(1.0, 0.8, 0.0);
    vec3 amber = vec3(1.0, 0.55, 0.0);
    vec3 coral = vec3(1.0, 0.42, 0.21);
    vec3 deep = vec3(0.1, 0.02, 0.0);

    vec3 col = mix(deep, coral, smoothstep(0.05, 0.25, intensity));
    col = mix(col, amber, smoothstep(0.25, 0.55, intensity));
    col = mix(col, yellow, smoothstep(0.55, 0.9, intensity));

    // Slight contrast lift in hot core
    col *= 1.0 + intensity * 0.4;

    // Full alpha — glow is vivid where it lives (behind icon), fades out naturally
    float alpha = smoothstep(0.02, 0.28, intensity) * 0.9;

    gl_FragColor = vec4(col, alpha);
  }
`;

function Plane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uResolution.value.set(
      state.size.width,
      state.size.height
    );
    // Smooth mouse follow
    materialRef.current.uniforms.uMouse.value.lerp(mouse.current, 0.05);
  });

  // Track mouse (normalized 0..1)
  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      mouse.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    // cleanup in useEffect not possible inside useMemo — rely on React unmount of parent
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export default function HeroLightning() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1] }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Plane />
      </Canvas>
    </div>
  );
}
