import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import SacredWorld from './SacredWorld';
import PostEffects from './PostEffects';
import PlayerController from './PlayerController';
import { AudioProvider } from './AudioController';

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
//  CanvasContainer — master R3F shell for the open-world Vesak experience
// ---------------------------------------------------------------------------
export default function CanvasContainer({
  blessings,
  onReady,
  onDiagnostics,
  controlsRef,
  sceneUnlocked,
  movementRef,
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
        camera={{ position: [0, 2, 15], fov: 50 }}
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
        {/* Atmospheric deep fog for open world */}
        <fog attach="fog" args={['#030106', 8, 80]} />

        {/* Spatial Web Audio Context */}
        <AudioProvider>
          {/* ---- Lighting -------------------------------------------------- */}
          <ambientLight intensity={0.08} />
          <hemisphereLight
            skyColor="#ff9900"
            groundColor="#0a0015"
            intensity={0.35}
          />

          {/* ---- Sacred Open World ----------------------------------------- */}
          <SacredWorld blessings={blessings} />

          {/* ---- Post Processing Pipeline --------------------------------- */}
          <PostEffects />

          {/* ---- Player Movement Controller -------------------------------- */}
          <PlayerController
            movementRef={movementRef}
            controlsRef={localControlsRef}
          />

          {/* ---- Diagnostics Telemetry ------------------------------------ */}
          {onDiagnostics && <DiagnosticsTracker onDiagnostics={onDiagnostics} />}

          {/* ---- Manual Camera Controls (look-around only) ---------------- */}
          <OrbitControls
            ref={localControlsRef}
            enableDamping
            dampingFactor={0.05}
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 6}
          />
        </AudioProvider>
      </Canvas>
    </div>
  );
}
