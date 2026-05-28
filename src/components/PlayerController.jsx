import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// PlayerController — translates joystick vectors into smooth camera movement.
// Runs inside the R3F Canvas. Reads from a shared ref (movementRef) updated
// by the HTML overlay VirtualJoystick component.
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_SPEED = 8.0;        // units per second
const CAMERA_HEIGHT = 2.0;     // fixed eye height (ground lock)
const WORLD_BOUND = 70;        // XZ clamp radius
const SMOOTHING = 0.12;        // lerp rate for velocity smoothing

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _velocity = new THREE.Vector3();

export default function PlayerController({ movementRef, controlsRef }) {
  const { camera } = useThree();
  const smoothVel = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!movementRef?.current) return;
    const dt = Math.min(delta, 0.1); // clamp for tab-refocus spikes
    const input = movementRef.current;

    // Smooth the joystick input to prevent jerky movement
    smoothVel.current.x += (input.x - smoothVel.current.x) * SMOOTHING;
    smoothVel.current.y += (input.y - smoothVel.current.y) * SMOOTHING;

    const sx = smoothVel.current.x;
    const sy = smoothVel.current.y;

    // Skip if effectively zero input
    if (Math.abs(sx) < 0.01 && Math.abs(sy) < 0.01) return;

    // Get camera forward direction, flatten to XZ plane
    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();

    // Compute right vector (perpendicular to forward on XZ plane)
    _right.crossVectors(_forward, _up).normalize();

    // Compose movement velocity
    _velocity.set(0, 0, 0);
    _velocity.addScaledVector(_forward, sy * MOVE_SPEED * dt);
    _velocity.addScaledVector(_right, sx * MOVE_SPEED * dt);

    // Compute next position and clamp to world bounds
    const nextPos = new THREE.Vector3().copy(camera.position).add(_velocity);
    nextPos.x = THREE.MathUtils.clamp(nextPos.x, -WORLD_BOUND, WORLD_BOUND);
    nextPos.z = THREE.MathUtils.clamp(nextPos.z, -WORLD_BOUND, WORLD_BOUND);
    nextPos.y = CAMERA_HEIGHT;

    // Calculate actual translation displacement
    const translation = new THREE.Vector3().subVectors(nextPos, camera.position);

    // Apply translation to camera
    camera.position.add(translation);

    // Translate OrbitControls target by same vector to prevent rubber-banding
    if (controlsRef?.current) {
      controlsRef.current.target.add(translation);
      controlsRef.current.target.y = CAMERA_HEIGHT;
      controlsRef.current.update();
    }
  });

  return null;
}
