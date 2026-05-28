import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LEAF_COUNT = 25;

/**
 * Creates the Bo Leaf (Ficus religiosa) outline as a THREE.Shape.
 * Heart-shaped base with an elongated, pointed drip-tip —
 * the distinctive feature of the sacred Bodhi Patra.
 */
function createBodhiLeafShape() {
  const shape = new THREE.Shape();

  // Start at the drip-tip (bottom point)
  shape.moveTo(0, -1.6);

  // Right side — sweep upward from the tip to the widest lobe
  shape.bezierCurveTo(
    0.35, -1.1,   // CP1: gentle outward curve near tip
    0.9,  -0.5,   // CP2: widening toward lobe
    0.95,  0.1    // End: right edge at widest point
  );

  // Right lobe — continue curving into the heart indent at top
  shape.bezierCurveTo(
    1.0,   0.55,  // CP1: upper right swell
    0.7,   1.0,   // CP2: shoulder of the heart
    0.35,  1.15   // End: approaching heart notch from right
  );

  // Heart notch — the small V-indent at the top centre
  shape.bezierCurveTo(
    0.15,  1.22,  // CP1: slight uptick
    0.05,  1.1,   // CP2: dip into notch
    0.0,   1.0    // End: centre of the notch
  );

  // Left lobe — mirror of the right, sweeping down
  shape.bezierCurveTo(
    -0.05, 1.1,
    -0.15, 1.22,
    -0.35, 1.15
  );

  shape.bezierCurveTo(
    -0.7,  1.0,
    -1.0,  0.55,
    -0.95, 0.1
  );

  // Left side — back down to the drip-tip
  shape.bezierCurveTo(
    -0.9, -0.5,
    -0.35, -1.1,
    0,    -1.6
  );

  return shape;
}

/**
 * Initialise per-leaf data: random positions, rotation speeds,
 * drift offsets, and scale.  Stored as a plain array of objects
 * so the render loop can mutate them through refs without
 * triggering React re-renders.
 */
function initLeafData() {
  const leaves = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    const x = THREE.MathUtils.randFloat(-15, 15);
    leaves.push({
      // Random starting position
      x,
      y: THREE.MathUtils.randFloat(-5, 15),
      z: THREE.MathUtils.randFloat(-20, 5),

      // Per-axis rotation speeds (radians / sec)
      rotSpeedX: THREE.MathUtils.randFloat(0.05, 0.25),
      rotSpeedY: THREE.MathUtils.randFloat(0.08, 0.3),
      rotSpeedZ: THREE.MathUtils.randFloat(0.03, 0.18),

      // Downward drift speed
      fallSpeed: THREE.MathUtils.randFloat(0.3, 0.9),

      // Horizontal sway parameters
      swayAmplitude: THREE.MathUtils.randFloat(0.3, 1.2),
      swayFrequency: THREE.MathUtils.randFloat(0.4, 1.0),
      swayPhase: THREE.MathUtils.randFloat(0, Math.PI * 2),

      // Scale
      scale: THREE.MathUtils.randFloat(0.3, 0.8),

      // Starting rotation angles (accumulated in the loop)
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,

      // Base X for sway oscillation (synced with starting x)
      baseX: x,
    });
  }
  return leaves;
}

export default function BodhiLeaves() {
  const groupRef = useRef();
  const leafRefs = useRef([]);

  // Shared geometry — all 25 leaves use one ShapeGeometry
  const leafGeometry = useMemo(() => {
    const shape = createBodhiLeafShape();
    const geom = new THREE.ShapeGeometry(shape, 12);
    return geom;
  }, []);

  // Shared material
  const leafMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#2e7d32',
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#1b5e20'),
      emissiveIntensity: 0.15,
      depthWrite: false, // prevents z-fight on transparent overlaps
    });
  }, []);

  // Per-leaf mutable data (never in React state)
  const leafData = useMemo(() => initLeafData(), []);

  // Animation loop — zero React state mutations
  useFrame((state, delta) => {
    // Clamp delta to prevent huge jumps on tab-refocus
    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = leafData[i];
      const mesh = leafRefs.current[i];
      if (!mesh) continue;

      // 1. Rotate on all three axes at unique rates
      leaf.rotX += leaf.rotSpeedX * dt;
      leaf.rotY += leaf.rotSpeedY * dt;
      leaf.rotZ += leaf.rotSpeedZ * dt;

      // 2. Drift downward
      leaf.y -= leaf.fallSpeed * dt;

      // 3. Horizontal sine-wave sway
      leaf.x = leaf.baseX + Math.sin(time * leaf.swayFrequency + leaf.swayPhase) * leaf.swayAmplitude;

      // 4. Recycle to top when below Y threshold
      if (leaf.y < -6) {
        leaf.y = THREE.MathUtils.randFloat(14, 17);
        leaf.baseX = THREE.MathUtils.randFloat(-15, 15);
        leaf.x = leaf.baseX;
        leaf.z = THREE.MathUtils.randFloat(-20, 5);
      }

      // Apply to mesh via ref (no setState)
      mesh.position.set(leaf.x, leaf.y, leaf.z);
      mesh.rotation.set(leaf.rotX, leaf.rotY, leaf.rotZ);
    }
  });

  return (
    <group ref={groupRef}>
      {leafData.map((leaf, i) => (
        <mesh
          key={i}
          ref={(el) => { leafRefs.current[i] = el; }}
          geometry={leafGeometry}
          material={leafMaterial}
          position={[leaf.x, leaf.y, leaf.z]}
          rotation={[leaf.rotX, leaf.rotY, leaf.rotZ]}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
        />
      ))}
    </group>
  );
}
