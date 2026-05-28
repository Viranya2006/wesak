import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// GuardianElephant — stylised low-poly ceremonial white elephant
// Built entirely from Three.js primitives (spheres, cylinders, cones, circles)
// with glowing sacred mark accent on forehead.
// ─────────────────────────────────────────────────────────────────────────────

const ELEPHANT_MAT = {
  color: '#e0e0e0',
  roughness: 0.6,
  metalness: 0.1,
};

const TUSK_MAT = {
  color: '#fffff0',
  roughness: 0.3,
  metalness: 0.2,
};

export default function GuardianElephant({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const groupRef = useRef();
  const earLRef = useRef();
  const earRRef = useRef();
  const headRef = useRef();

  // Geometries — memoised once, shared across all elephants via React cache
  const bodyGeom = useMemo(() => new THREE.SphereGeometry(1.2, 8, 6), []);
  const headGeom = useMemo(() => new THREE.SphereGeometry(0.7, 8, 6), []);
  const legGeom = useMemo(() => new THREE.CylinderGeometry(0.2, 0.18, 1.0, 6), []);
  const trunkGeom = useMemo(() => new THREE.CylinderGeometry(0.15, 0.08, 1.2, 6), []);
  const earGeom = useMemo(() => new THREE.CircleGeometry(0.5, 6), []);
  const tuskGeom = useMemo(() => new THREE.ConeGeometry(0.06, 0.5, 4), []);
  const tailGeom = useMemo(() => new THREE.CylinderGeometry(0.03, 0.02, 0.8, 4), []);

  // Materials
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial(ELEPHANT_MAT), []);
  const tuskMat = useMemo(() => new THREE.MeshStandardMaterial(TUSK_MAT), []);

  // Animation — gentle ear flap + slow head bob
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (earLRef.current) {
      earLRef.current.rotation.y = Math.sin(t * 1.2) * 0.15 - 0.3;
    }
    if (earRRef.current) {
      earRRef.current.rotation.y = -Math.sin(t * 1.2) * 0.15 + 0.3;
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 0.8) * 0.04;
      headRef.current.position.y = 0.9 + Math.sin(t * 0.6) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* ── Body (elongated sphere) ── */}
      <mesh geometry={bodyGeom} material={bodyMat} scale={[1.4, 1, 1]} position={[0, 0.7, 0]} />

      {/* ── Head ── */}
      <group ref={headRef} position={[0, 0.9, 1.2]}>
        <mesh geometry={headGeom} material={bodyMat} />

        {/* ── Trunk (curved downward) ── */}
        <mesh
          geometry={trunkGeom}
          material={bodyMat}
          position={[0, -0.3, 0.5]}
          rotation={[0.6, 0, 0]}
        />

        {/* ── Left Ear ── */}
        <mesh
          ref={earLRef}
          geometry={earGeom}
          material={bodyMat}
          position={[-0.6, 0.15, 0.1]}
          rotation={[0, -0.3, 0]}
        />

        {/* ── Right Ear ── */}
        <mesh
          ref={earRRef}
          geometry={earGeom}
          material={bodyMat}
          position={[0.6, 0.15, 0.1]}
          rotation={[0, 0.3, 0]}
        />

        {/* ── Left Tusk ── */}
        <mesh
          geometry={tuskGeom}
          material={tuskMat}
          position={[-0.25, -0.45, 0.35]}
          rotation={[0.3, 0, 0.2]}
        />

        {/* ── Right Tusk ── */}
        <mesh
          geometry={tuskGeom}
          material={tuskMat}
          position={[0.25, -0.45, 0.35]}
          rotation={[0.3, 0, -0.2]}
        />

        {/* ── Sacred Forehead Mark (glowing point light) ── */}
        <pointLight
          color="#f59e0b"
          intensity={0.6}
          distance={4}
          decay={2}
          position={[0, 0.35, 0.55]}
        />
        <mesh position={[0, 0.35, 0.55]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* ── Front Left Leg ── */}
      <mesh geometry={legGeom} material={bodyMat} position={[-0.5, 0, 0.6]} />
      {/* ── Front Right Leg ── */}
      <mesh geometry={legGeom} material={bodyMat} position={[0.5, 0, 0.6]} />
      {/* ── Back Left Leg ── */}
      <mesh geometry={legGeom} material={bodyMat} position={[-0.5, 0, -0.6]} />
      {/* ── Back Right Leg ── */}
      <mesh geometry={legGeom} material={bodyMat} position={[0.5, 0, -0.6]} />

      {/* ── Tail ── */}
      <mesh
        geometry={tailGeom}
        material={bodyMat}
        position={[0, 0.5, -1.4]}
        rotation={[0.4, 0, 0]}
      />
    </group>
  );
}
