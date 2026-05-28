import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import Atapattama from './Atapattama';
import FloatingLanterns from './FloatingLanterns';
import BodhiLeaves from './BodhiLeaves';
import SparkParticles from './SparkParticles';
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
// Tier 1: Master Landmark Positions (5 — cardinal compass + center)
// ─────────────────────────────────────────────────────────────────────────────
const MASTER_LANTERNS = [
  { pos: [0, 3, -2.5],   palette: 0, variant: 1 },  // Center (nested)
  { pos: [20, 3, 0],     palette: 1, variant: 0 },  // East
  { pos: [-20, 3, 0],    palette: 2, variant: 0 },  // West
  { pos: [0, 3, 20],     palette: 3, variant: 2 },  // South
  { pos: [0, 3, -25],    palette: 4, variant: 1 },  // North
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
      palette: (i + 3) % PALETTES.length,
      variant: i % 2 === 0 ? 2 : 0,
      scale: 1.0 + (i % 2) * 0.2,
    });
  }
  return sentinels;
}

// ─────────────────────────────────────────────────────────────────────────────
// SacredWorld — master open-world layout component
// ─────────────────────────────────────────────────────────────────────────────
export default function SacredWorld({ blessings }) {
  const sentinels = useMemo(() => generateSentinels(), []);

  return (
    <group>
      {/* ═══════════════════════════════════════════════════════════════════
          A. Starfield Background (Deep Space)
          ═══════════════════════════════════════════════════════════════════ */}
      <Stars
        radius={120}
        depth={60}
        count={6000}
        factor={6}
        saturation={0.5}
        fade
        speed={1.5}
      />

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
          C. Tier 2 — Mid-field Sentinel Lanterns (12 - lightweight for performance)
          ═══════════════════════════════════════════════════════════════════ */}
      {sentinels.map((s, i) => (
        <group key={`sentinel-${i}`}>
          <Atapattama
            position={s.pos}
            scale={s.scale || 1.2}
            variant={s.variant}
            lightweight
            glowColor={PALETTES[s.palette].glowColor}
            paperColor={PALETTES[s.palette].paperColor}
          />
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
    </group>
  );
}

