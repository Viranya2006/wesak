import React, { useMemo } from 'react';
import * as THREE from 'three';
import Atapattama from './Atapattama';
import FloatingLanterns from './FloatingLanterns';
import BodhiLeaves from './BodhiLeaves';
import SparkParticles from './SparkParticles';
import GuardianElephant from './GuardianElephant';
import { PositionalLanternAudio } from './AudioController';

// ─────────────────────────────────────────────────────────────────────────────
// Cultural Colour Palettes
// ─────────────────────────────────────────────────────────────────────────────
const PALETTES = [
  { glowColor: '#d32f2f', paperColor: '#ffcdd2' },  // Cardinal Red
  { glowColor: '#ffb300', paperColor: '#fff8e1' },  // Golden Yellow
  { glowColor: '#ff6a00', paperColor: '#ffe0b2' },  // Festival Orange
  { glowColor: '#fff8e7', paperColor: '#fffde7' },  // Pristine White
  { glowColor: '#e91e63', paperColor: '#fce4ec' },  // Lotus Pink
  { glowColor: '#7b1fa2', paperColor: '#f3e5f5' },  // Royal Purple
  { glowColor: '#1565c0', paperColor: '#e3f2fd' },  // Sapphire Blue
  { glowColor: '#2e7d32', paperColor: '#e8f5e9' },  // Sacred Green
];

// ─────────────────────────────────────────────────────────────────────────────
// Terrain Floor Shader — dark stone with sacred tile grid
// ─────────────────────────────────────────────────────────────────────────────
const TerrainShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    float grid(vec2 uv, float size) {
      vec2 g = abs(fract(uv * size) - 0.5);
      float line = min(g.x, g.y);
      return 1.0 - smoothstep(0.0, 0.02, line);
    }

    void main() {
      // Base dark earth
      vec3 base = vec3(0.04, 0.03, 0.02);

      // Sacred tile grid — subtle warm glow along seams
      float g1 = grid(vUv, 20.0) * 0.06;
      float g2 = grid(vUv, 4.0) * 0.03;
      vec3 gridColor = vec3(0.2, 0.07, 0.0);

      // Distance fade from center
      float dist = length(vUv - 0.5) * 2.0;
      float fade = 1.0 - smoothstep(0.3, 1.0, dist);

      vec3 finalColor = base + gridColor * (g1 + g2) * fade;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// Tier 1: Master Landmark Positions (5 — cardinal compass + center)
// ─────────────────────────────────────────────────────────────────────────────
const MASTER_LANTERNS = [
  { pos: [0, 3, -2.5],   poleH: 3,   palette: 0, variant: 1 },  // Center (nested)
  { pos: [20, 3, 0],     poleH: 3,   palette: 1, variant: 0 },  // East
  { pos: [-20, 3, 0],    poleH: 3,   palette: 2, variant: 0 },  // West
  { pos: [0, 3, 20],     poleH: 3,   palette: 3, variant: 2 },  // South
  { pos: [0, 3, -25],    poleH: 3,   palette: 4, variant: 1 },  // North
];

// ─────────────────────────────────────────────────────────────────────────────
// Tier 2: Mid-field Sentinel Positions (12 — 2 concentric rings)
// ─────────────────────────────────────────────────────────────────────────────
function generateSentinels() {
  const sentinels = [];
  // Inner ring — radius 15, 6 lanterns
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    sentinels.push({
      pos: [Math.cos(angle) * 15, 2, Math.sin(angle) * 15],
      poleH: 2,
      palette: i % PALETTES.length,
      variant: i % 2 === 0 ? 0 : 2,
      scale: 1.0 + (i % 3) * 0.15,
    });
  }
  // Outer ring — radius 35, 6 lanterns
  for (let i = 0; i < 6; i++) {
    const angle = ((i + 0.5) / 6) * Math.PI * 2;
    sentinels.push({
      pos: [Math.cos(angle) * 35, 2, Math.sin(angle) * 35],
      poleH: 2,
      palette: (i + 3) % PALETTES.length,
      variant: i % 2 === 0 ? 2 : 0,
      scale: 1.0 + (i % 2) * 0.2,
    });
  }
  return sentinels;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guardian Elephant Positions (4 — cardinal corners, facing inward)
// ─────────────────────────────────────────────────────────────────────────────
const ELEPHANTS = [
  { pos: [25, 0, 25],   rot: [0, -Math.PI * 0.75, 0] },  // SE → faces NW
  { pos: [-25, 0, 25],  rot: [0, -Math.PI * 0.25, 0] },  // SW → faces NE
  { pos: [25, 0, -25],  rot: [0, Math.PI * 0.75, 0] },   // NE → faces SW
  { pos: [-25, 0, -25], rot: [0, Math.PI * 0.25, 0] },   // NW → faces SE
];

// ─────────────────────────────────────────────────────────────────────────────
// Bamboo Pole component (simple cylinder under a ground-mounted lantern)
// ─────────────────────────────────────────────────────────────────────────────
function BambooPole({ position, height }) {
  return (
    <mesh position={[position[0], height / 2, position[2]]}>
      <cylinderGeometry args={[0.05, 0.05, height, 6]} />
      <meshStandardMaterial color="#3d2100" roughness={0.8} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SacredWorld — master open-world layout component
// ─────────────────────────────────────────────────────────────────────────────
export default function SacredWorld({ blessings }) {
  const terrainMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(TerrainShader.uniforms),
      vertexShader: TerrainShader.vertexShader,
      fragmentShader: TerrainShader.fragmentShader,
      side: THREE.DoubleSide,
    });
  }, []);

  const terrainGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(150, 150, 64, 64);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, []);

  const sentinels = useMemo(() => generateSentinels(), []);

  return (
    <group>
      {/* ═══════════════════════════════════════════════════════════════════
          A. Terrain Floor
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh geometry={terrainGeom} material={terrainMat} position={[0, 0, 0]} />

      {/* ═══════════════════════════════════════════════════════════════════
          B. Tier 1 — Master Landmark Lanterns (5)
          ═══════════════════════════════════════════════════════════════════ */}
      {MASTER_LANTERNS.map((m, i) => (
        <group key={`master-${i}`}>
          <Atapattama
            position={m.pos}
            scale={2.0 + (i === 0 ? 0.5 : 0)}
            variant={m.variant}
            isHub={i === 0}
            glowColor={PALETTES[m.palette].glowColor}
            paperColor={PALETTES[m.palette].paperColor}
          />
          <BambooPole position={m.pos} height={m.poleH} />
          <PositionalLanternAudio />
          {/* Area light for master landmarks */}
          <pointLight
            color={PALETTES[m.palette].glowColor}
            intensity={2}
            distance={18}
            decay={1.5}
            position={m.pos}
          />
        </group>
      ))}

      {/* ═══════════════════════════════════════════════════════════════════
          C. Tier 2 — Mid-field Sentinel Lanterns (12)
          ═══════════════════════════════════════════════════════════════════ */}
      {sentinels.map((s, i) => (
        <group key={`sentinel-${i}`}>
          <Atapattama
            position={s.pos}
            scale={s.scale || 1.2}
            variant={s.variant}
            glowColor={PALETTES[s.palette].glowColor}
            paperColor={PALETTES[s.palette].paperColor}
          />
          <BambooPole position={s.pos} height={s.poleH} />
        </group>
      ))}

      {/* ═══════════════════════════════════════════════════════════════════
          D. Tier 3 — Sky Blessing Stream (floating, lightweight)
          ═══════════════════════════════════════════════════════════════════ */}
      <FloatingLanterns blessings={blessings} />

      {/* ═══════════════════════════════════════════════════════════════════
          E. Sacred Bo Leaves (falling from above)
          ═══════════════════════════════════════════════════════════════════ */}
      <BodhiLeaves />

      {/* ═══════════════════════════════════════════════════════════════════
          F. GPU Ember Particles
          ═══════════════════════════════════════════════════════════════════ */}
      <SparkParticles />

      {/* ═══════════════════════════════════════════════════════════════════
          G. Guardian Elephants (4 at cardinal corners)
          ═══════════════════════════════════════════════════════════════════ */}
      {ELEPHANTS.map((e, i) => (
        <GuardianElephant
          key={`elephant-${i}`}
          position={e.pos}
          rotation={e.rot}
        />
      ))}
    </group>
  );
}
