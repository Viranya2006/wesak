import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Atapattama from './Atapattama';
import FloatingLanterns from './FloatingLanterns';
import BodhiLeaves from './BodhiLeaves';
import SparkParticles from './SparkParticles';
import ThoranaShrine from './ThoranaShrine';
import LotusRain from './LotusRain';
import { PositionalLanternAudio } from './AudioController';

const PALETTES = [
  { glowColor: '#d32f2f', paperColor: '#ffcdd2' },
  { glowColor: '#ffb300', paperColor: '#fff8e1' },
  { glowColor: '#ff6a00', paperColor: '#ffe0b2' },
  { glowColor: '#fff8e7', paperColor: '#fffde7' },
  { glowColor: '#e91e63', paperColor: '#fce4ec' },
  { glowColor: '#7b1fa2', paperColor: '#f3e5f5' },
  { glowColor: '#1565c0', paperColor: '#e3f2fd' },
  { glowColor: '#2e7d32', paperColor: '#e8f5e9' },
];

const MASTER_LANTERNS = [
  { pos: [0, 3, -2.5],   palette: 0, variant: 1 },
  { pos: [20, 3, 0],     palette: 1, variant: 0 },
  { pos: [-20, 3, 0],    palette: 2, variant: 0 },
  { pos: [0, 3, 20],     palette: 3, variant: 2 },
  { pos: [0, 3, -25],    palette: 4, variant: 1 },
];

function generateSentinels() {
  const sentinels = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    sentinels.push({
      pos: [Math.cos(angle) * 15, 2, Math.sin(angle) * 15],
      palette: i % PALETTES.length,
      variant: i % 2 === 0 ? 0 : 2,
      scale: 1.0 + (i % 3) * 0.15,
    });
  }
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

const SHRINE_POS = [0, 0, -15];
const SHRINE_PROXIMITY = 20.0;

export default function SacredWorld({ blessings, playerPosRef }) {
  const sentinels = useMemo(() => generateSentinels(), []);
  const { camera } = useThree();
  const [lotusActive, setLotusActive] = useState(false);
  const frameCountRef = useRef(0);

  useFrame(() => {
    frameCountRef.current++;
    if (frameCountRef.current % 6 !== 0) return;
    const dx = camera.position.x - SHRINE_POS[0];
    const dz = camera.position.z - SHRINE_POS[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const isNear = dist <= SHRINE_PROXIMITY;
    if (isNear !== lotusActive) {
      setLotusActive(isNear);
    }
  });

  return (
    <group>
      <Stars radius={120} depth={60} count={6000} factor={6} saturation={0.5} fade speed={1.5} />

      <ThoranaShrine position={SHRINE_POS} />
      <LotusRain active={lotusActive} center={SHRINE_POS} />

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
          <pointLight
            color={PALETTES[m.palette].glowColor}
            intensity={2}
            distance={18}
            decay={1.5}
            position={m.pos}
          />
        </group>
      ))}

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

      <FloatingLanterns blessings={blessings} />
      <BodhiLeaves />
      <SparkParticles />
    </group>
  );
}