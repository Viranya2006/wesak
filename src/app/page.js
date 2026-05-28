'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import CanvasContainer from '../components/CanvasContainer';
import VirtualJoystick from '../components/VirtualJoystick';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { captureBrandedCard } from '../lib/captureCard';

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
  const { blessings, submitBlessing } = useSupabaseSync();

  // Scene unlock state — controlled by landing gate
  const [sceneUnlocked, setSceneUnlocked] = useState(false);

  // Canvas & diagnostics
  const [canvasState, setCanvasState] = useState(null);
  const [diagnostics, setDiagnostics] = useState({
    fps: 60,
    drawCalls: 0,
    geometries: 0,
    textures: 0,
  });

  // Hotspot system
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Blessing form
  const [blessingInput, setBlessingInput] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFormFeedback, setShowFormFeedback] = useState(false);

  // Camera mode tracking
  const [cameraMode, setCameraMode] = useState('Explore');
  const controlsRef = useRef();
  const bgAudioRef = useRef(null);

  // Joystick → PlayerController movement bridge
  const movementRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  // WASD keyboard support — maps keys to movementRef when joystick is idle
  useEffect(() => {
    if (!sceneUnlocked) return;
    const update = () => {
      const k = keysRef.current;
      const kx = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      const ky = (k.w ? 1 : 0) - (k.s ? 1 : 0);
      // Only override if no joystick input
      if (movementRef.current.x === 0 && movementRef.current.y === 0) {
        movementRef.current = { x: kx, y: ky };
      }
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

  const handleDiagnostics = useCallback((stats) => {
    setDiagnostics(stats);
  }, []);

  const handleSceneUnlock = useCallback(() => {
    setSceneUnlocked(true);
  }, []);

  // ── Hotspot click handler (no camera animation in open world) ──

  const handleHotspotClick = useCallback(
    (key) => {
      // Toggle panel visibility (player walks to it in open world)
      if (activeHotspot === key) {
        setActiveHotspot(null);
        return;
      }
      setActiveHotspot(key);
    },
    [activeHotspot],
  );

  // ── Blessing submission ──
  const handleBlessingSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!blessingInput.trim()) return;

      // 1. Spawn lantern in the 3D sky
      submitBlessing(blessingInput);

      // 2. Capture branded card composite
      setIsCapturing(true);
      setTimeout(() => {
        if (canvasState && canvasState.gl) {
          captureBrandedCard(canvasState.gl, blessingInput);
        }
        setIsCapturing(false);
        setBlessingInput('');
        setShowFormFeedback(true);
        setTimeout(() => setShowFormFeedback(false), 4000);
      }, 500);
    },
    [blessingInput, canvasState, submitBlessing],
  );

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
          3D WebGL Canvas Layer — always mounted so it pre-loads
          ═══════════════════════════════════════════════════════════════════ */}
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
        onDiagnostics={handleDiagnostics}
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
          <VirtualJoystick onMove={(v) => { movementRef.current = v; }} />

          {/* ── Top-Right WebGL Diagnostics Panel ── */}
          <div className="absolute top-6 right-6 z-10 glass-panel p-4 rounded-xl font-mono text-xs text-green-400 w-64 pointer-events-auto">
            <h2 className="text-cx-gold text-[10px] tracking-wider font-bold mb-2 pb-1 border-b border-white/10 uppercase">
              WebGL Diagnostics
            </h2>
            <div className="space-y-1 text-cx-cream/90 font-mono">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className={diagnostics.fps < 45 ? 'text-red-400' : 'text-green-400'}>
                  {diagnostics.fps} FPS
                </span>
              </div>
              <div className="flex justify-between">
                <span>GPU Draw Calls:</span>
                <span>{diagnostics.drawCalls}</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated Geometries:</span>
                <span>{diagnostics.geometries}</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated Textures:</span>
                <span>{diagnostics.textures}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Sky Lanterns:</span>
                <span>{blessings.length}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                <span>Camera Mode:</span>
                <span className={cameraMode === 'Auto' ? 'text-cx-gold' : 'text-blue-400'}>
                  {cameraMode}
                </span>
              </div>
            </div>
          </div>

          {/* ── Hotspot Expansion Card (left column) ── */}
          {activeHotspot && (
            <div className="absolute left-6 top-[150px] w-96 max-h-[60vh] z-10 glass-panel p-6 rounded-2xl flex flex-col justify-between pointer-events-auto animate-fade-in">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] tracking-wider text-cx-gold font-bold uppercase font-mono">
                    Corporate Vertical
                  </span>
                  <button
                    onClick={() => handleHotspotClick(activeHotspot)}
                    className="text-cx-cream/40 hover:text-cx-cream text-sm font-mono cursor-pointer transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
                <h3 className="text-xl font-bold font-display text-cx-cream mb-3 leading-snug">
                  {HOTSPOTS[activeHotspot].title}
                </h3>
                <p className="text-sm text-cx-cream/70 leading-relaxed font-sans font-light custom-scroll overflow-y-auto pr-1">
                  {HOTSPOTS[activeHotspot].description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href={HOTSPOTS[activeHotspot].link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center bg-cx-gold hover:bg-cx-gold/90 text-black font-semibold text-xs py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-cx-gold/20"
                >
                  <span>IMPLEMENT ENGINE INTEGRATION</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          )}

          {/* ── Blessing Submission Card (bottom-right) ── */}
          <div className="absolute right-6 bottom-6 w-96 z-10 glass-panel p-6 rounded-2xl pointer-events-auto">
            <h2 className="text-sm font-bold font-display text-cx-gold mb-1 uppercase tracking-wider">
              Submit A Lantern Blessing
            </h2>
            <p className="text-[11px] text-cx-cream/60 leading-normal mb-4">
              Type your message below. It will float as an individual 3D lantern emitting spatial
              audio, and compile into a custom Ceylon X viral card.
            </p>

            {showFormFeedback ? (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center text-xs text-green-300">
                <div className="text-lg mb-1">🪔 Success!</div>
                Your blessing has floated to the sky. Look for your crimson lantern, and check your
                downloads folder for your composite share card!
              </div>
            ) : (
              <form onSubmit={handleBlessingSubmit} className="space-y-3">
                <textarea
                  value={blessingInput}
                  onChange={(e) => setBlessingInput(e.target.value)}
                  placeholder="e.g. Wishing health, prosperity, and peace for all beings..."
                  maxLength={120}
                  rows={3}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-cx-cream/90 placeholder-cx-cream/30 focus:outline-none focus:border-cx-gold/60 resize-none font-sans"
                />
                <div className="text-right text-[10px] text-cx-cream/40 font-mono mt-[-8px]">
                  {blessingInput.length}/120 characters
                </div>
                <button
                  type="submit"
                  disabled={isCapturing}
                  className={`w-full bg-cx-gold/20 hover:bg-cx-gold/30 border border-cx-gold/40 hover:border-cx-gold text-cx-gold font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wide cursor-pointer ${
                    isCapturing ? 'opacity-50 cursor-wait' : ''
                  }`}
                >
                  {isCapturing ? 'Capturing Scene Buffer...' : 'Launch Lantern & Share'}
                </button>
              </form>
            )}
          </div>

          {/* ── Bottom Center: Innovation Hub Navigation ── */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-xl px-4 pointer-events-auto">
            <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
              <div className="text-center">
                <span className="text-[9px] tracking-[0.25em] text-cx-gold font-bold uppercase font-mono">
                  Ceylon X Innovation Hub
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(HOTSPOTS).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleHotspotClick(key)}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer leading-snug flex flex-col justify-center items-center h-16 ${
                      activeHotspot === key
                        ? 'bg-cx-gold text-black border-cx-gold shadow-lg shadow-cx-gold/20'
                        : 'bg-black/30 text-cx-cream/70 border-white/5 hover:border-cx-gold/30 hover:text-cx-cream'
                    }`}
                  >
                    <span>
                      {HOTSPOTS[key].title
                        .split(' & ')[0]
                        .split(' Implementation ')[0]
                        .split(' Software ')[0]}
                    </span>
                    <span className="text-[8px] opacity-60 mt-1 font-mono">
                      {activeHotspot === key ? '◀ View' : 'Focus'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom-Left Branding Watermark ── */}
          <div className="absolute bottom-6 left-6 z-10 pointer-events-none opacity-50 flex flex-col font-mono text-[9px] text-cx-cream/80">
            <span>Engineered by Ceylon X Corporation</span>
            <span>ceylonx.co</span>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Capture overlay — shown on top of everything during card capture
          ═══════════════════════════════════════════════════════════════════ */}
      {isCapturing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 pointer-events-none">
          <div className="text-cx-gold text-sm font-mono tracking-widest animate-pulse">
            COMPILING CAPTURE MATRIX...
          </div>
        </div>
      )}
    </main>
  );
}
