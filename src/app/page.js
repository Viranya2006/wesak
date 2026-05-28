'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CanvasContainer from '../components/CanvasContainer';
import VirtualJoystick from '../components/VirtualJoystick';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

// ─────────────────────────────────────────────────────────────────────────────
// Hotspot definitions — corporate verticals with camera positioning & lookAt
// ─────────────────────────────────────────────────────────────────────────────
const HOTSPOTS = {
  software: {
    title: 'Custom Software Architectures',
    description:
      'Architecting high-scale, zero-downtime microservices and mission-critical enterprise systems. Engineered with military-grade redundancy, optimized data pipelines, and next-generation cloud infrastructure.',
    link: 'https://ceylonx.co/',
    camPos: { x: 1.8, y: 0.8, z: -1.2 },
    lookAt: { x: 0, y: 0.2, z: -2.5 },
  },
  erp: {
    title: 'Integrated ERP & Retail POS Solutions',
    description:
      'Omni-channel enterprise resource planning platforms linking inventory, sales forecasting, payroll, and real-time ledger accounting. Seamless offline-first POS syncing for global retail networks.',
    link: 'https://ceylonx.co/',
    camPos: { x: -2.0, y: 0.5, z: -1.8 },
    lookAt: { x: 0, y: 0.2, z: -2.5 },
  },
  ai: {
    title: 'AI Implementation Frameworks',
    description:
      'Embedding domain-specific large language models, computer vision systems, and automated agent workflows directly into enterprise software stacks. Data-secure, custom-trained intelligence matrices.',
    link: 'https://ceylonx.co/',
    camPos: { x: 0.8, y: -0.6, z: -0.8 },
    lookAt: { x: 0, y: 0.2, z: -2.5 },
  },
};

// Default camera position for scene reset
const DEFAULT_CAM = { x: 0, y: 1, z: 6 };
const DEFAULT_LOOK = { x: 0, y: 0.2, z: -2.5 };

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)',
        opacity: fadingOut ? 0 : fadedIn ? 1 : 0,
        transition: 'opacity 1s ease',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      {/* ── Title Block ── */}
      <h1
        className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-[0.35em] mb-4 select-none"
        style={{ color: '#f59e0b' }}
      >
        CEYLON X
      </h1>
      <p
        className="font-sans text-xs sm:text-sm tracking-[0.25em] uppercase mb-10"
        style={{ color: '#fff8e7' }}
      >
        VESAK KALAPAYA — IMMERSIVE 3D EXPERIENCE
      </p>

      {/* ── Pulsing Mandala ── */}
      <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
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
        className="max-w-lg text-center text-sm sm:text-base leading-relaxed font-sans mb-10 px-6"
        style={{ color: 'rgba(255,248,231,0.7)' }}
      >
        Celebrate the sacred Festival of Vesak through an interactive cinematic journey featuring
        traditional Atapattama lanterns, spatial audio, and stunning visual effects.
      </p>

      {/* ── CTA Button ── */}
      <button
        onClick={handleUnveil}
        className="px-10 py-4 rounded-xl text-sm sm:text-base font-bold tracking-wider uppercase cursor-pointer
                   transition-all duration-300 ease-out hover:scale-105 active:scale-95"
        style={{
          backgroundColor: '#f59e0b',
          color: '#000000',
          boxShadow: '0 0 40px rgba(245,158,11,0.35), 0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        ENTER EXPERIENTIAL VESAK KALAPAYA WITH AUDIO
      </button>

      <p className="mt-4 text-xs" style={{ color: 'rgba(255,248,231,0.35)' }}>
        🔊 Best experienced with headphones
      </p>

      {/* ── Bottom Signature ── */}
      <p
        className="absolute bottom-6 text-[10px] tracking-wider font-mono"
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

      <CanvasContainer
        blessings={blessings}
        onReady={handleCanvasReady}
        controlsRef={controlsRef}
        sceneUnlocked={sceneUnlocked}
        movementRef={movementRef}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          UI OVERLAYS — visible only after scene is unlocked
          ═══════════════════════════════════════════════════════════════════ */}
      {sceneUnlocked && (
        <>
          {/* ── Top-Left Header Branding ── */}
          <div className="absolute top-6 left-6 z-10 flex flex-col pointer-events-none">
            <h1 className="text-2xl font-bold tracking-widest text-cx-gold font-display animate-pulse-slow">
              CEYLON X
            </h1>
            <span className="text-[10px] tracking-[0.3em] text-cx-cream/60 font-mono mt-1">
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

          {/* ── Bottom-Left Branding Watermark ── */}
          <div className="absolute bottom-6 left-6 z-10 pointer-events-none opacity-50 flex flex-col font-mono text-[9px] text-cx-cream/80">
            <span>Engineered by Ceylon X Corporation</span>
            <span>ceylonx.co</span>
          </div>
        </>
      )}
    </main>
  );
}
