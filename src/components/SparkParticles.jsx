import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 1500;

export default function SparkParticles() {
  const meshRef = useRef();
  
  // Track individual particle physics in raw arrays (zero React state updates)
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      data.push({
        x: (Math.random() - 0.5) * 35,
        y: -10 + Math.random() * 25,
        z: -25 + Math.random() * 20,
        speedY: 0.05 + Math.random() * 0.08,
        speedX: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.02,
        scale: 0.05 + Math.random() * 0.12,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        wobbleRange: 0.2 + Math.random() * 0.4,
        seed: Math.random() * 100
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color('#ffd700'), []); // Golden embers

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!meshRef.current) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      // Move upward
      p.y += p.speedY;
      
      // Wind turbulence / Perlin-like sine drift
      p.x += Math.sin(time * p.wobbleSpeed + p.seed) * 0.015 + p.speedX;
      p.z += Math.cos(time * p.wobbleSpeed + p.seed) * 0.015 + p.speedZ;

      // Clean fade out boundary near the top (y: 15)
      // We scale the particle down to 0 as it approaches y = 15
      let currentScale = p.scale;
      if (p.y > 10) {
        // Linear fade out between y=10 and y=15
        const fadeFactor = Math.max(0, 1 - (p.y - 10) / 5);
        currentScale *= fadeFactor;
      }

      // Reset when particle goes above the boundary
      if (p.y > 15) {
        p.y = -10;
        p.x = (Math.random() - 0.5) * 35;
        p.z = -25 + Math.random() * 20;
      }

      // Update instanced matrix
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(currentScale, currentScale, currentScale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
      {/* Tiny spheres for ember particles */}
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
