import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────
// Lotus Filigree Stencil Shader (Saviya Panels)
// ─────────────────────────────────────────────
const SaviyaShader = {
  uniforms: {
    uTime: { value: 0 },
    uGlowColor: { value: new THREE.Color('#ff5500') },
    uPaperColor: { value: new THREE.Color('#fff8e7') },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vUv = uv;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uGlowColor;
    uniform vec3 uPaperColor;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
      float flicker = sin(uTime * 5.2) * cos(uTime * 3.1) * 0.12 + 0.88;

      // Lotus stencil cutout using polar coordinates
      vec2 uv = vUv * 2.0 - 1.0;
      float angle = atan(uv.y, uv.x);
      float radius = length(uv);
      float petals = abs(sin(angle * 4.0)) * 0.4 + 0.2;
      float innerCircle = smoothstep(0.15, 0.18, radius);
      float outerCircle = 1.0 - smoothstep(petals - 0.05, petals, radius);
      float pattern = innerCircle * outerCircle;
      float border = abs(
        smoothstep(petals - 0.08, petals - 0.03, radius) -
        smoothstep(petals - 0.03, petals + 0.02, radius)
      );

      vec3 paperGlow = mix(uPaperColor, uGlowColor * 1.6, fresnel) * flicker;
      vec3 frameColor = vec3(1.0, 1.0, 1.0);
      vec3 finalColor = mix(paperGlow, frameColor, border * 0.7);
      float alpha = mix(0.3, 1.0, pattern);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────
// Rali Fluid Kinetic Tassel Shader
// ─────────────────────────────────────────────
const RaliShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#fff8e7') },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Anchor factor: top of plane stays fixed, bottom waves freely
      float anchor = 1.0 - uv.y;
      pos.x += sin(pos.y * 2.5 + uTime * 3.0) * 0.08 * anchor;
      pos.z += cos(pos.y * 1.8 + uTime * 2.5) * 0.06 * anchor;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // Translucent tissue paper fade toward the tail tip
      float fadeOut = smoothstep(0.0, 0.35, vUv.y);
      gl_FragColor = vec4(uColor, 0.8 * fadeOut);
    }
  `,
};

// ─────────────────────────────────────────────
// Edge Line Extraction Helper
// ─────────────────────────────────────────────
function StructuralEdges({ geometry, position, rotation, quaternion }) {
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <lineSegments
      geometry={edgesGeom}
      position={position}
      rotation={rotation}
      quaternion={quaternion}
    >
      <lineBasicMaterial
        color="#ffffff"
        linewidth={1}
        transparent
        opacity={0.6}
      />
    </lineSegments>
  );
}

// ─────────────────────────────────────────────
// 6 Face Cap Layout — one pyramidal cap per cube face normal
// ─────────────────────────────────────────────
function computeFaceCaps(coneHeight) {
  return [
    // +Y top
    { pos: [0, 0.5, 0], rot: [0, 0, 0] },
    // -Y bottom
    { pos: [0, -0.5, 0], rot: [Math.PI, 0, 0] },
    // +X right
    { pos: [0.5, 0, 0], rot: [0, 0, -Math.PI / 2] },
    // -X left
    { pos: [-0.5, 0, 0], rot: [0, 0, Math.PI / 2] },
    // +Z front
    { pos: [0, 0, 0.5], rot: [Math.PI / 2, 0, 0] },
    // -Z back
    { pos: [0, 0, -0.5], rot: [-Math.PI / 2, 0, 0] },
  ];
}

// ─────────────────────────────────────────────
// 8 Corner Spike Layout — diagonal spike at each cube vertex
// ─────────────────────────────────────────────
function computeCornerCaps() {
  const signs = [1, -1];
  const caps = [];
  for (const sx of signs) {
    for (const sy of signs) {
      for (const sz of signs) {
        const dir = new THREE.Vector3(sx, sy, sz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir
        );
        caps.push({
          position: [sx * 0.5, sy * 0.5, sz * 0.5],
          quaternion: q,
        });
      }
    }
  }
  return caps;
}

// ─────────────────────────────────────────────
// Rali Tail Positions — 4 bottom-facing cube corners
// ─────────────────────────────────────────────
const TASSEL_POSITIONS = [
  [0.5, -0.5, 0.5],
  [0.5, -0.5, -0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, -0.5, -0.5],
];

// ─────────────────────────────────────────────
// Atapattama Component
// ─────────────────────────────────────────────
export default function Atapattama({
  position = [0, 0, -2.5],
  scale = 1,
  variant = 0,
  isHub = false,
  glowColor = '#ff5500',
  paperColor = '#fff8e7',
  ...props
}) {
  const groupRef = useRef();
  const pointLightRef = useRef();

  // Variant-driven geometry parameters
  const coneHeight = variant === 2 ? 1.0 : 0.7;

  // ── Shader Materials (tinted per-instance via props) ──
  const saviyaMaterial = useMemo(
    () => {
      const mat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(SaviyaShader.uniforms),
        vertexShader: SaviyaShader.vertexShader,
        fragmentShader: SaviyaShader.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      mat.uniforms.uGlowColor.value = new THREE.Color(glowColor);
      mat.uniforms.uPaperColor.value = new THREE.Color(paperColor);
      return mat;
    },
    [glowColor, paperColor]
  );

  const raliMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(RaliShader.uniforms),
        vertexShader: RaliShader.vertexShader,
        fragmentShader: RaliShader.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  // ── Geometries (memoised once) ──
  const boxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const faceCapGeom = useMemo(
    () => new THREE.ConeGeometry(0.707, coneHeight, 4, 1, false),
    [coneHeight]
  );
  const cornerCapGeom = useMemo(
    () => new THREE.ConeGeometry(0.35, 0.5, 4, 1, false),
    []
  );
  const bambooGeom = useMemo(() => new THREE.BoxGeometry(0.96, 0.96, 0.96), []);
  const tasselGeom = useMemo(
    () => new THREE.PlaneGeometry(0.15, 2.0, 8, 48),
    []
  );

  // ── Structural layout ──
  const faceCaps = useMemo(() => computeFaceCaps(coneHeight), [coneHeight]);
  const cornerCaps = useMemo(() => computeCornerCaps(), []);

  // ── Animation (zero React state writes) ──
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Update shader time uniforms
    saviyaMaterial.uniforms.uTime.value = t;
    raliMaterial.uniforms.uTime.value = t;

    // Slow Y rotation + gentle floating bob
    if (groupRef.current) {
      groupRef.current.rotation.y =
        (variant === 2 ? Math.PI / 4 : 0) + t * 0.15;
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.6) * 0.15;
    }

    // Warm flickering point light
    if (pointLightRef.current) {
      const flicker = Math.sin(t * 5.2) * Math.cos(t * 3.1) * 0.15 + 0.85;
      const micro = 1.0 + Math.sin(t * 15.0) * 0.08;
      const base = isHub ? 4.5 : 2.5;
      pointLightRef.current.intensity = base * flicker * micro;
    }
  });

  // ── Variant 2 (Diamond): initial Y rotation applied in useFrame ──
  // ── Variant 1 (Nested): render a smaller inner lantern ──

  return (
    <group
      ref={groupRef}
      position={position}
      scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
      {...props}
    >
      {/* ╔══════════════════════════════════════╗
          ║  1. Central Cube Body                ║
          ╚══════════════════════════════════════╝ */}
      <mesh geometry={boxGeom} material={saviyaMaterial} />
      <StructuralEdges geometry={boxGeom} />

      {/* ╔══════════════════════════════════════╗
          ║  2. Internal Bamboo Skeleton         ║
          ║     (Bata Koora wireframe)           ║
          ╚══════════════════════════════════════╝ */}
      <mesh geometry={bambooGeom}>
        <meshBasicMaterial
          color="#3d2100"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* ╔══════════════════════════════════════╗
          ║  3A. 6 Large Pyramidal Face Caps     ║
          ╚══════════════════════════════════════╝ */}
      {faceCaps.map((f, i) => (
        <group key={`face-${i}`}>
          <mesh
            geometry={faceCapGeom}
            material={saviyaMaterial}
            position={f.pos}
            rotation={f.rot}
          />
          <StructuralEdges
            geometry={faceCapGeom}
            position={f.pos}
            rotation={f.rot}
          />
        </group>
      ))}

      {/* ╔══════════════════════════════════════╗
          ║  3B. 8 Corner Spikes                 ║
          ╚══════════════════════════════════════╝ */}
      {cornerCaps.map((c, i) => (
        <group key={`corner-${i}`}>
          <mesh
            geometry={cornerCapGeom}
            material={saviyaMaterial}
            position={c.position}
            quaternion={c.quaternion}
          />
          <StructuralEdges
            geometry={cornerCapGeom}
            position={c.position}
            quaternion={c.quaternion}
          />
        </group>
      ))}

      {/* ╔══════════════════════════════════════╗
          ║  4. Hanging Fluid Kinetic Tails      ║
          ║     (Rali)                           ║
          ╚══════════════════════════════════════╝ */}
      {TASSEL_POSITIONS.map((tp, i) => (
        <group key={`rali-${i}`} position={tp}>
          <mesh
            geometry={tasselGeom}
            material={raliMaterial}
            position={[0, -1.0, 0]}
          />
        </group>
      ))}

      {/* ╔══════════════════════════════════════╗
          ║  5. Warm Flickering Point Light      ║
          ╚══════════════════════════════════════╝ */}
      <pointLight
        ref={pointLightRef}
        color={glowColor}
        distance={6}
        decay={1.5}
        position={[0, 0, 0]}
      />

      {/* ╔══════════════════════════════════════╗
          ║  6. Variant 1 — Nested Inner Lantern ║
          ╚══════════════════════════════════════╝ */}
      {variant === 1 && <NestedInner saviyaMaterial={saviyaMaterial} />}
    </group>
  );
}

// ─────────────────────────────────────────────
// Nested Inner Lantern (Variant 1)
// ─────────────────────────────────────────────
function NestedInner({ saviyaMaterial }) {
  const innerRef = useRef();
  const innerBoxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const innerFaceCapGeom = useMemo(
    () => new THREE.ConeGeometry(0.707, 0.7, 4, 1, false),
    []
  );
  const innerCornerCapGeom = useMemo(
    () => new THREE.ConeGeometry(0.35, 0.5, 4, 1, false),
    []
  );
  const faceCaps = useMemo(() => computeFaceCaps(0.7), []);
  const cornerCaps = useMemo(() => computeCornerCaps(), []);

  // Counter-rotate inner lantern for visual depth
  useFrame((state) => {
    if (innerRef.current) {
      innerRef.current.rotation.y = -state.clock.getElapsedTime() * 0.25;
    }
  });

  return (
    <group ref={innerRef} scale={[0.4, 0.4, 0.4]}>
      <mesh geometry={innerBoxGeom} material={saviyaMaterial} />
      <StructuralEdges geometry={innerBoxGeom} />

      {faceCaps.map((f, i) => (
        <group key={`inner-face-${i}`}>
          <mesh
            geometry={innerFaceCapGeom}
            material={saviyaMaterial}
            position={f.pos}
            rotation={f.rot}
          />
          <StructuralEdges
            geometry={innerFaceCapGeom}
            position={f.pos}
            rotation={f.rot}
          />
        </group>
      ))}

      {cornerCaps.map((c, i) => (
        <group key={`inner-corner-${i}`}>
          <mesh
            geometry={innerCornerCapGeom}
            material={saviyaMaterial}
            position={c.position}
            quaternion={c.quaternion}
          />
          <StructuralEdges
            geometry={innerCornerCapGeom}
            position={c.position}
            quaternion={c.quaternion}
          />
        </group>
      ))}

      <pointLight color="#ff7700" intensity={1.5} distance={3} decay={1.5} />
    </group>
  );
}
