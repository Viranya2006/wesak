'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvasContainer from '../components/CanvasContainer';
import VirtualJoystick from '../components/VirtualJoystick';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

// ─────────────────────────────────────────────────────────────────────────────
// Shrine position — must match SacredWorld's SHRINE_POS
// ─────────────────────────────────────────────────────────────────────────────
const SHRINE_POS = { x: 0, z: -15 };
const SHRINE_NEAR_DIST = 20.0;

// ─────────────────────────────────────────────────────────────────────────────
// Smooth volume lerp helper
// ─────────────────────────────────────────────────────────────────────────────
function lerpVolume(audioEl, target, rate) {
  if (!audioEl) return;
  const diff = target - audioEl.volume;
  if (Math.abs(diff) < 0.005) {
    audioEl.volume = target;
  } else {
    audioEl.volume += diff * rate;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Gate — full-screen premium overlay
// ─────────────────────────────────────────────────────────────────────────────
function LandingGate({ onUnlock }) {
  const [visible, setVisible] = useState(true);
  const [fadedIn, setFadedIn] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFadedIn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleUnveil = useCallback(async () => {
    // 1. Create / resume AudioContext
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (err) {
      console.warn('AudioContext initialization failed:', err);
    }

    // 2. Fade-out transition
    setFadingOut(true);

    // 3. After transition ends, unmount and unlock scene
    setTimeout(() => {
      setVisible(false);
      onUnlock();
    }, 800);
  }, [onUnlock]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)',
        opacity: fadingOut ? 0 : fadedIn ? 1 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      {/* ── Title Block ── */}
      <h1
        className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-[0.2em] sm:tracking-[0.35em] mb-3 select-none text-center"
        style={{ color: '#f59e0b' }}
      >
        CEYLON X
      </h1>
      <p
        className="font-sans text-[10px] sm:text-xs md:text-sm tracking-[0.18em] sm:tracking-[0.25em] uppercase mb-8 sm:mb-10 text-center"
        style={{ color: '#fff8e7' }}
      >
        VESAK KALAPAYA — IMMERSIVE 3D EXPERIENCE
      </p>

      {/* ── Pulsing Mandala ── */}
      <div className="relative w-28 h-28 sm:w-40 sm:h-40 mb-8 sm:mb-10 flex items-center justify-center">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(245,158,11,0.08) 50%, transparent 70%)',
            animation: 'mandala-pulse 3s ease-in-out infinite',
          }}
        />
        {/* Inner bright core */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '60%',
            background:
              'radial-gradient(circle, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0.15) 60%, transparent 80%)',
            animation: 'mandala-pulse 3s ease-in-out infinite 0.4s',
          }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: '20%',
            height: '20%',
            background:
              'radial-gradient(circle, #f59e0b 0%, rgba(245,158,11,0.4) 70%, transparent 100%)',
            animation: 'mandala-pulse 3s ease-in-out infinite 0.8s',
            boxShadow: '0 0 30px rgba(245,158,11,0.5)',
          }}
        />
      </div>

      {/* ── Descriptive Text ── */}
      <p
        className="max-w-md text-center text-xs sm:text-sm md:text-base leading-relaxed font-sans mb-8 sm:mb-10 px-4"
        style={{ color: 'rgba(255,248,231,0.7)' }}
      >
        Celebrate the sacred Festival of Vesak through an interactive cinematic journey featuring
        traditional Atapattama lanterns, spatial audio, and stunning visual effects.
      </p>

      {/* ── CTA Button ── */}
      <button
        onClick={handleUnveil}
        className="px-6 py-3.5 sm:px-10 sm:py-4 rounded-xl text-xs sm:text-sm md:text-base font-bold tracking-wider uppercase cursor-pointer
                   transition-all duration-300 ease-out hover:scale-105 active:scale-95 text-center max-w-full"
        style={{
          backgroundColor: '#f59e0b',
          color: '#000000',
          boxShadow: '0 0 40px rgba(245,158,11,0.35), 0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        ENTER EXPERIENTIAL VESAK KALAPAYA WITH AUDIO
      </button>

      <p className="mt-4 text-[10px] sm:text-xs" style={{ color: 'rgba(255,248,231,0.35)' }}>
        🔊 Best experienced with headphones
      </p>

      {/* ── Bottom Signature ── */}
      <p
        className="absolute bottom-4 sm:bottom-6 text-[9px] sm:text-[10px] tracking-wider font-mono text-center w-full px-4"
        style={{ color: 'rgba(245,158,11,0.5)' }}
      >
        Engineered by Ceylon X Corporation — ceylonx.co
      </p>

      {/* ── Keyframes injected via style tag ── */}
      <style>{`
        @keyframes mandala-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { blessings } = useSupabaseSync();

  // Scene unlock state — controlled by landing gate
  const [sceneUnlocked, setSceneUnlocked] = useState(false);

  // Canvas state
  const [canvasState, setCanvasState] = useState(null);

  // Camera controls
  const controlsRef = useRef();
  const bgAudioRef = useRef(null);
  const nearAudioRef = useRef(null);

  // Player position ref — written by PlayerController inside R3F, read here for proximity audio
  const playerPosRef = useRef({ x: 0, y: 2, z: 15 });

  // Joystick & keyboard movement bridge
  const movementRef = useRef({ x: 0, y: 0 });
  const joystickActiveRef = useRef(false);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  // WASD keyboard support — maps keys to movementRef when joystick is idle
  useEffect(() => {
    if (!sceneUnlocked) return;
    const update = () => {
      if (joystickActiveRef.current) return;
      const k = keysRef.current;
      const kx = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      const ky = (k.w ? 1 : 0) - (k.s ? 1 : 0);
      movementRef.current = { x: kx, y: ky };
    };
    const onDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current) { keysRef.current[key] = true; update(); }
    };
    const onUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current) { keysRef.current[key] = false; update(); }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [sceneUnlocked]);

  // ── Start background music when scene is unlocked ──
  useEffect(() => {
    if (!sceneUnlocked || !bgAudioRef.current) return;
    const audio = bgAudioRef.current;
    audio.volume = 0.45;
    audio.play().catch((err) =>
      console.warn('Background audio autoplay blocked:', err)
    );
  }, [sceneUnlocked]);

  // ── Proximity Audio Crossfade System ──
  // Polls playerPosRef every 100ms, computes distance to shrine,
  // and smoothly crossfades between bg.mp3 and near.mp3
  useEffect(() => {
    if (!sceneUnlocked) return;

    const nearStartedRef = { current: false };

    const interval = setInterval(() => {
      const pos = playerPosRef.current;
      if (!pos) return;

      const dx = pos.x - SHRINE_POS.x;
      const dz = pos.z - SHRINE_POS.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const bgAudio = bgAudioRef.current;
      const nearAudio = nearAudioRef.current;

      if (dist <= SHRINE_NEAR_DIST) {
        // Near shrine — fade bg down, fade near up
        lerpVolume(bgAudio, 0.05, 0.08);
        lerpVolume(nearAudio, 0.6, 0.08);

        // Start near audio if not playing
        if (nearAudio && !nearStartedRef.current) {
          nearAudio.play().catch(() => {});
          nearStartedRef.current = true;
        }
      } else {
        // Far from shrine — fade bg up, fade near down
        lerpVolume(bgAudio, 0.45, 0.08);
        lerpVolume(nearAudio, 0.0, 0.08);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sceneUnlocked]);

  // ── Callbacks ──
  const handleCanvasReady = useCallback((state) => {
    setCanvasState(state);
  }, []);

  const handleSceneUnlock = useCallback(() => {
    setSceneUnlocked(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-black">
      {/* ═══════════════════════════════════════════════════════════════════
          LANDING GATE — blocks everything until user clicks CTA
          ═══════════════════════════════════════════════════════════════════ */}
      {!sceneUnlocked && <LandingGate onUnlock={handleSceneUnlock} />}

      {/* ═══════════════════════════════════════════════════════════════════
          Background Music — constant loop, starts on scene unlock
          ═══════════════════════════════════════════════════════════════════ */}
      <audio
        ref={bgAudioRef}
        src="/audio/bg.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          Proximity Music — near.mp3, loops when close to shrine
          ═══════════════════════════════════════════════════════════════════ */}
      <audio
        ref={nearAudioRef}
        src="/audio/near.mp3"
        loop
        preload="auto"
        style={{ display: 'none' }}
      />

      <CanvasContainer
        blessings={blessings}
        onReady={handleCanvasReady}
        controlsRef={controlsRef}
        sceneUnlocked={sceneUnlocked}
        movementRef={movementRef}
        playerPosRef={playerPosRef}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          UI OVERLAYS — visible only after scene is unlocked
          ═══════════════════════════════════════════════════════════════════ */}
      {sceneUnlocked && (
        <>
          {/* ── Top-Left Header Branding ── */}
          <div className="absolute top-6 left-6 z-10 flex flex-col pointer-events-none">
            <h1 className="text-lg sm:text-2xl font-bold tracking-widest text-cx-gold font-display animate-pulse-slow">
              CEYLON X
            </h1>
            <span className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] text-cx-cream/60 font-mono mt-0.5">
              VESAK KALAPAYA — OPEN WORLD
            </span>
          </div>

          {/* ── Virtual Joystick (bottom-left) ── */}
          <VirtualJoystick onMove={(v) => { 
            joystickActiveRef.current = (v.x !== 0 || v.y !== 0);
            if (joystickActiveRef.current) {
              movementRef.current = v;
            } else {
              const k = keysRef.current;
              const kx = (k.d ? 1 : 0) - (k.a ? 1 : 0);
              const ky = (k.w ? 1 : 0) - (k.s ? 1 : 0);
              movementRef.current = { x: kx, y: ky };
            }
          }} />

          {/* ── Bottom-Right Branding Watermark ── */}
          <div className="absolute bottom-6 right-6 z-10 pointer-events-none opacity-50 flex flex-col text-right font-mono text-[9px] text-cx-cream/80">
            <span>Engineered by Ceylon X Corporation</span>
            <span>ceylonx.co</span>
          </div>
        </>
      )}
    </main>
  );
}
