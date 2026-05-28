import React, { useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Atapattama from './Atapattama';
import SparkParticles from './SparkParticles';
import FloatingLanterns from './FloatingLanterns';
import BodhiLeaves from './BodhiLeaves';
import PostEffects from './PostEffects';
import { AudioProvider, PositionalLanternAudio } from './AudioController';

// ---------------------------------------------------------------------------
//  CONSTANTS
// ---------------------------------------------------------------------------
const LOOK_AT_TARGET = new THREE.Vector3(0, 0, -2.5);
const FLIGHT_SPEED = 0.003;            // progress per frame (~60 fps → full loop ≈ 5.5 s)
const IDLE_RESUME_MS = 7000;           // 7 seconds of no input before auto-flight resumes
const EASE_BACK_RATE = 0.015;          // lerp rate when easing back onto the spline

// ---------------------------------------------------------------------------
//  AutoCamera — cinematic CatmullRomCurve3 flight with user-override logic
// ---------------------------------------------------------------------------
function AutoCamera({ controlsRef }) {
  const { camera } = useThree();

  // Flight spline — 8 control points forming a sweeping closed loop
  const flightPath = React.useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 3, 12),
          new THREE.Vector3(8, 5, 6),
          new THREE.Vector3(10, 2, -4),
          new THREE.Vector3(4, 6, -10),
          new THREE.Vector3(-4, 4, -8),
          new THREE.Vector3(-10, 2, -2),
          new THREE.Vector3(-6, 5, 6),
          new THREE.Vector3(0, 3, 12),
        ],
        true, // closed curve
      ),
    [],
  );

  const progressRef = useRef(0);
  const userControlRef = useRef(false);
  const idleTimerRef = useRef(null);
  const easingBackRef = useRef(false);

  // ---- pointer / touch handlers — pause auto-flight on interaction ----------
  const handlePointerDown = useCallback(() => {
    userControlRef.current = true;
    easingBackRef.current = false;

    // Enable OrbitControls for manual interaction
    if (controlsRef?.current) {
      controlsRef.current.enabled = true;
    }

    // Clear any pending resume timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [controlsRef]);

  const handlePointerUp = useCallback(() => {
    // Start the 7-second idle countdown to resume auto-flight
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      easingBackRef.current = true;  // smooth transition back to spline
    }, IDLE_RESUME_MS);
  }, []);

  // Attach pointer listeners to the canvas DOM element
  useEffect(() => {
    const domElement = document.querySelector('canvas');
    if (!domElement) return;

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handlePointerDown, handlePointerUp]);

  // ---- render loop ----------------------------------------------------------
  useFrame(() => {
    // --- Easing back onto the spline after idle timeout -----------------------
    if (easingBackRef.current) {
      // Snap progress to the closest point on the spline to avoid jumps
      const splinePos = flightPath.getPointAt(progressRef.current % 1);
      const currentPos = camera.position.clone();
      const blended = currentPos.lerp(splinePos, EASE_BACK_RATE);
      camera.position.copy(blended);
      camera.lookAt(LOOK_AT_TARGET);

      // Once close enough, hand control fully back to auto-flight
      if (currentPos.distanceTo(splinePos) < 0.15) {
        userControlRef.current = false;
        easingBackRef.current = false;

        // Disable OrbitControls during auto-flight
        if (controlsRef?.current) {
          controlsRef.current.enabled = false;
        }
      }
      return;
    }

    // --- User has control — do nothing, OrbitControls handles it -------------
    if (userControlRef.current) return;

    // --- Automatic cinematic flight ------------------------------------------
    progressRef.current = (progressRef.current + FLIGHT_SPEED) % 1;
    const point = flightPath.getPointAt(progressRef.current);
    camera.position.copy(point);
    camera.lookAt(LOOK_AT_TARGET);

    // Keep OrbitControls disabled while flying
    if (controlsRef?.current) {
      controlsRef.current.enabled = false;
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
//  DiagnosticsTracker — samples FPS, draw calls, geometries, textures
// ---------------------------------------------------------------------------
function DiagnosticsTracker({ onDiagnostics }) {
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useFrame((state) => {
    framesRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 500) {
      const fps = Math.round((framesRef.current * 1000) / elapsed);
      if (onDiagnostics) {
        onDiagnostics({
          fps: Math.min(fps, 240),
          drawCalls: state.gl.info.render.calls,
          geometries: state.gl.info.memory.geometries,
          textures: state.gl.info.memory.textures,
        });
      }
      framesRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
//  CanvasContainer — master R3F shell for the Vesak Kalapaya experience
// ---------------------------------------------------------------------------
export default function CanvasContainer({
  blessings,
  onReady,
  onDiagnostics,
  controlsRef,
  sceneUnlocked,
}) {
  // Always call useRef unconditionally (rules of hooks)
  const internalControlsRef = useRef(null);
  const localControlsRef = controlsRef || internalControlsRef;

  // ---- Loading gate ---------------------------------------------------------
  if (!sceneUnlocked) {
    return (
      <div className="w-full h-full absolute inset-0 bg-black flex items-center justify-center z-0">
        <div className="text-amber-200/60 text-lg animate-pulse select-none">
          Preparing the Vesak Kalapaya…
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 bg-black overflow-hidden z-0">
      <Canvas
        shadows
        camera={{ position: [0, 3, 12], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onCreated={(state) => {
          if (onReady) {
            onReady({
              gl: state.gl,
              camera: state.camera,
              scene: state.scene,
            });
          }
        }}
      >
        {/* Atmospheric warm fog */}
        <fog attach="fog" args={['#050208', 15, 55]} />

        {/* Spatial Web Audio Context */}
        <AudioProvider>
          {/* ---- Lighting -------------------------------------------------- */}
          <ambientLight intensity={0.12} />
          <hemisphereLight
            skyColor="#ff9900"
            groundColor="#0a0015"
            intensity={0.5}
          />

          {/* ---- Centerpiece Atapattama (Hub) ------------------------------ */}
          <group>
            <Atapattama
              position={[0, 0.2, -2.5]}
              scale={1.3}
              isHub={true}
              variant={0}
            />
            <PositionalLanternAudio />
          </group>

          {/* ---- GPU Ember Particles --------------------------------------- */}
          <SparkParticles />

          {/* ---- Floating Blessings / Ambient Sky Lanterns ----------------- */}
          <FloatingLanterns blessings={blessings} />

          {/* ---- Sacred Bodhi Leaves -------------------------------------- */}
          <BodhiLeaves />

          {/* ---- Post Processing Pipeline --------------------------------- */}
          <PostEffects />

          {/* ---- Cinematic Auto Camera ------------------------------------ */}
          <AutoCamera controlsRef={localControlsRef} />

          {/* ---- Diagnostics Telemetry ------------------------------------ */}
          <DiagnosticsTracker onDiagnostics={onDiagnostics} />

          {/* ---- Manual Camera Controls ----------------------------------- */}
          <OrbitControls
            ref={localControlsRef}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 1.7}
            minDistance={2.5}
            maxDistance={25}
            enabled={false} /* starts disabled — AutoCamera is in charge */
          />
        </AudioProvider>
      </Canvas>
    </div>
  );
}
