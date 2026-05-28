import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LotusRain — 800 instanced pink lotus petals that cascade from above
// when the player enters the Thorana shrine proximity zone (d ≤ 6.0).
// ─────────────────────────────────────────────────────────────────────────────

const PETAL_COUNT = 800;
const SKY_CEIL = 12.0;
const GROUND_FLOOR = -1.0;
const SPREAD_XZ = 12;

// Build a lotus petal shape using bezier curves
function createPetalShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.06, 0.12, 0.12, 0.25, 0.08, 0.4);
  shape.bezierCurveTo(0.04, 0.5, 0.0, 0.55, 0.0, 0.55);
  shape.bezierCurveTo(0.0, 0.55, -0.04, 0.5, -0.08, 0.4);
  shape.bezierCurveTo(-0.12, 0.25, -0.06, 0.12, 0, 0);
  return shape;
}

export default function LotusRain({ active = false, center = [0, 0, -15] }) {
  const meshRef = useRef();

  // Petal geometry (extruded teardrop shape)
  const petalGeom = useMemo(() => {
    const shape = createPetalShape();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 1,
    });
    // Center the geometry
    geom.computeBoundingBox();
    geom.center();
    return geom;
  }, []);

  // Per-petal simulation data (positions, velocities, rotations)
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      data.push({
        // Start distributed randomly in the sky volume above shrine
        x: center[0] + (Math.random() - 0.5) * SPREAD_XZ * 2,
        y: GROUND_FLOOR + Math.random() * (SKY_CEIL - GROUND_FLOOR),
        z: center[2] + (Math.random() - 0.5) * SPREAD_XZ * 2,
        // Fall speed
        vy: -(0.5 + Math.random() * 1.2),
        // Rotation speeds (per axis)
        rx: Math.random() * 2 - 1,
        ry: Math.random() * 2 - 1,
        rz: Math.random() * 2 - 1,
        // Current rotation state
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        // Cosine drift parameters
        driftAmpX: 0.3 + Math.random() * 0.8,
        driftAmpZ: 0.3 + Math.random() * 0.8,
        driftFreqX: 0.3 + Math.random() * 0.6,
        driftFreqZ: 0.3 + Math.random() * 0.6,
        driftPhaseX: Math.random() * Math.PI * 2,
        driftPhaseZ: Math.random() * Math.PI * 2,
        // Individual scale
        scale: 0.3 + Math.random() * 0.5,
        // Seed for time offset
        seed: Math.random() * 100,
      });
    }
    return data;
  }, [center]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Track activation fade
  const fadeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();

    // Smooth activation fade (0 → 1 over ~1 second)
    const targetFade = active ? 1.0 : 0.0;
    fadeRef.current += (targetFade - fadeRef.current) * dt * 2.0;
    const fade = fadeRef.current;

    // Skip if fully hidden
    if (fade < 0.001) {
      // Set all petals to zero scale
      for (let i = 0; i < PETAL_COUNT; i++) {
        dummy.position.set(0, -100, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      return;
    }

    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = particles[i];

      // Fall downward
      p.y += p.vy * dt * fade;

      // Cosine drift on XZ
      p.x += Math.cos(time * p.driftFreqX + p.driftPhaseX) * p.driftAmpX * dt * fade;
      p.z += Math.sin(time * p.driftFreqZ + p.driftPhaseZ) * p.driftAmpZ * dt * fade;

      // Rotation
      p.rotX += p.rx * dt * 1.5;
      p.rotY += p.ry * dt * 1.5;
      p.rotZ += p.rz * dt * 0.8;

      // Reset when below ground
      if (p.y < GROUND_FLOOR) {
        p.y = SKY_CEIL + Math.random() * 3;
        p.x = center[0] + (Math.random() - 0.5) * SPREAD_XZ * 2;
        p.z = center[2] + (Math.random() - 0.5) * SPREAD_XZ * 2;
      }

      // Petal scale with fade
      const s = p.scale * fade;

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[petalGeom, null, PETAL_COUNT]} frustumCulled={false}>
      <meshBasicMaterial
        color="#ff66b2"
        transparent
        opacity={0.75}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
