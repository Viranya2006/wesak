import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Atapattama from './Atapattama';
import { PositionalLanternAudio } from './AudioController';

// ─────────────────────────────────────────────────────────────────────────────
// Cultural colour palette — each lantern gets a unique glow/paper combo
// ─────────────────────────────────────────────────────────────────────────────
const CULTURAL_PALETTES = [
  { glowColor: '#d32f2f', paperColor: '#ffcdd2' },  // Cardinal Red
  { glowColor: '#ffb300', paperColor: '#fff8e1' },  // Golden Yellow
  { glowColor: '#ff6a00', paperColor: '#ffe0b2' },  // Festival Orange
  { glowColor: '#fff8e7', paperColor: '#fffde7' },  // Pristine White
  { glowColor: '#e91e63', paperColor: '#fce4ec' },  // Lotus Pink
  { glowColor: '#7b1fa2', paperColor: '#f3e5f5' },  // Royal Purple
  { glowColor: '#1565c0', paperColor: '#e3f2fd' },  // Sapphire Blue
  { glowColor: '#2e7d32', paperColor: '#e8f5e9' },  // Sacred Green
];

export default function FloatingLanterns({ blessings }) {
  const lanternGroupRefs = useRef([]);

  // Split blessings into ambient (background) vs user-submitted
  const ambientLanterns = useMemo(
    () => blessings.filter((b) => !b.isUserSubmitted),
    [blessings]
  );

  const userLanterns = useMemo(
    () => blessings.filter((b) => b.isUserSubmitted),
    [blessings]
  );

  // ---------- Animation Loop — mutate positions via refs ----------
  useFrame(() => {
    for (let i = 0; i < ambientLanterns.length; i++) {
      const lantern = ambientLanterns[i];
      const groupNode = lanternGroupRefs.current[i];
      if (!groupNode) continue;

      // Rise upward, drift sideways
      lantern.y += lantern.vy * 0.016;
      lantern.x += lantern.vx * 0.016;
      lantern.z += lantern.vz * 0.016;

      // Recycle lanterns that float past Y=22 back to Y=-15
      if (lantern.y > 22) {
        lantern.y = -15;
        lantern.x = (Math.random() - 0.5) * 35;
        lantern.z = (Math.random() - 0.5) * 20;
      }

      // Update the group position directly (zero React state writes)
      groupNode.position.set(lantern.x, lantern.y, lantern.z);
    }
  });

  return (
    <group>
      {/* ── Ambient Sky Lanterns — full Atapattama in cultural colours ── */}
      {ambientLanterns.map((lantern, i) => {
        const palette = CULTURAL_PALETTES[i % CULTURAL_PALETTES.length];
        const variant = i % 3; // cycle through standard, nested, diamond

        return (
          <group
            key={lantern.id}
            ref={(el) => { lanternGroupRefs.current[i] = el; }}
            position={[lantern.x, lantern.y, lantern.z]}
          >
            <Atapattama
              position={[0, 0, 0]}
              scale={lantern.scale * 0.5}
              variant={variant}
              lightweight
              glowColor={palette.glowColor}
              paperColor={palette.paperColor}
            />
          </group>
        );
      })}

      {/* ── User-submitted lanterns — full Atapattama + spatial audio ── */}
      {userLanterns.map((lantern) => (
        <group key={lantern.id} position={[lantern.x, lantern.y, lantern.z]}>
          <Atapattama
            position={[0, 0, 0]}
            scale={lantern.scale}
            variant={1}
            lightweight
            glowColor="#ff1744"
            paperColor="#ffcdd2"
          />
          <PositionalLanternAudio />
        </group>
      ))}
    </group>
  );
}
