import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseGIF, decompressFrames } from 'gifuct-js';

// ─────────────────────────────────────────────────────────────────────────────
// Thorana Shrine — 3D tiered archway with animated GIF projection panel
// Position: [0, 0, -15]
// ─────────────────────────────────────────────────────────────────────────────

const SHRINE_POS = [0, 0, -15];
// Original source: https://kaputa.com/thorana/mobile/thorana2010_large_www.kaputa.com_by-chula.gif
// Downloaded locally to avoid CORS blocking
const GIF_URL = '/images/thorana.gif';

// ── Fallback procedural shader (only used if GIF fails to load) ──
const FallbackShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float angle = atan(uv.y, uv.x);
      float radius = length(uv);
      float rings = sin(radius * 12.0 - uTime * 1.5) * 0.5 + 0.5;
      float petals = abs(sin(angle * 8.0 + uTime * 0.5)) * 0.5 + 0.5;
      float pattern = rings * petals * smoothstep(1.0, 0.3, radius);
      vec3 color = mix(vec3(0.15, 0.05, 0.0), vec3(1.0, 0.75, 0.2), pattern);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ── Decorative Finial (small ornamental cone) ──
function Finial({ position }) {
  return (
    <mesh position={position}>
      <coneGeometry args={[0.15, 0.5, 6]} />
      <meshStandardMaterial color="#daa520" metalness={0.6} roughness={0.3} emissive="#8b6914" emissiveIntensity={0.3} />
    </mesh>
  );
}

// ── Main Thorana Shrine Component ──
export default function ThoranaShrine({ position = SHRINE_POS }) {
  // GIF animation state (all in refs to avoid React re-renders)
  const gifLoadedRef = useRef(false);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const frameTimerRef = useRef(0);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const canvasTexRef = useRef(null);
  const panelMeshRef = useRef();
  const panelMeshBackRef = useRef();

  // Fallback shader material (only used if GIF fails)
  const fallbackMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(FallbackShader.uniforms),
      vertexShader: FallbackShader.vertexShader,
      fragmentShader: FallbackShader.fragmentShader,
      side: THREE.DoubleSide,
    });
  }, []);

  // Pillar material (memoised)
  const pillarMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b8860b',
        metalness: 0.4,
        roughness: 0.5,
        emissive: '#4a3000',
        emissiveIntensity: 0.15,
      }),
    []
  );

  // Load and decode GIF with gifuct-js
  useEffect(() => {
    let cancelled = false;

    async function loadGif() {
      try {
        const resp = await fetch(GIF_URL);
        const buff = await resp.arrayBuffer();
        const gif = parseGIF(buff);
        const frames = decompressFrames(gif, true);

        if (cancelled || frames.length === 0) return;

        // Create offscreen canvas matching GIF dimensions
        const { width, height } = frames[0].dims;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Create the Three.js CanvasTexture
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;

        // Create a clean MeshBasicMaterial (no glow, no emissive)
        const gifMat = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.DoubleSide,
          toneMapped: false,
        });

        // Apply material to panel meshes
        if (panelMeshRef.current) panelMeshRef.current.material = gifMat;
        if (panelMeshBackRef.current) panelMeshBackRef.current.material = gifMat;

        // Store refs for animation loop
        canvasRef.current = canvas;
        ctxRef.current = ctx;
        canvasTexRef.current = tex;
        framesRef.current = frames;
        frameIndexRef.current = 0;
        frameTimerRef.current = 0;
        gifLoadedRef.current = true;

        // Draw first frame immediately
        drawFrame(ctx, frames[0], width, height, null);
        tex.needsUpdate = true;

      } catch (err) {
        console.warn('GIF decode failed, using procedural fallback:', err);
      }
    }

    loadGif();

    return () => {
      cancelled = true;
      if (canvasTexRef.current) canvasTexRef.current.dispose();
    };
  }, []);

  // Temp canvas for frame patch compositing
  const tempCanvasRef = useRef(null);
  const tempCtxRef = useRef(null);

  // Draw a single decoded GIF frame onto the main canvas with proper compositing
  const drawFrame = useCallback((ctx, frame, canvasW, canvasH, prevFrame) => {
    const { dims, patch, disposalType } = frame;

    // Handle disposal of PREVIOUS frame before drawing current
    // disposalType 2 = restore to background (clear the previous frame's area)
    if (prevFrame && prevFrame.disposalType === 2) {
      ctx.clearRect(
        prevFrame.dims.left,
        prevFrame.dims.top,
        prevFrame.dims.width,
        prevFrame.dims.height
      );
    }

    // Create temp canvas if needed (or resize)
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
      tempCtxRef.current = tempCanvasRef.current.getContext('2d');
    }
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCtxRef.current;

    // Resize temp canvas to match this frame's patch dimensions
    tempCanvas.width = dims.width;
    tempCanvas.height = dims.height;

    // Put decoded pixel data onto temp canvas
    const imageData = new ImageData(
      new Uint8ClampedArray(patch),
      dims.width,
      dims.height
    );
    tempCtx.putImageData(imageData, 0, 0);

    // Composite the patch onto the main canvas using drawImage
    // This respects alpha transparency properly (unlike putImageData on main canvas)
    ctx.drawImage(tempCanvas, dims.left, dims.top);
  }, []);

  // Animation loop — advance GIF frames + fallback shader time
  useFrame((state, delta) => {
    // Animate fallback shader time (in case GIF didn't load)
    if (!gifLoadedRef.current) {
      fallbackMat.uniforms.uTime.value = state.clock.getElapsedTime();
      return;
    }

    // Advance GIF frame timer
    const frames = framesRef.current;
    if (frames.length === 0) return;

    frameTimerRef.current += delta * 1000; // convert to ms
    const currentFrame = frames[frameIndexRef.current];
    const delay = currentFrame.delay || 100; // default 100ms if unset

    if (frameTimerRef.current >= delay) {
      frameTimerRef.current -= delay;
      const prevIndex = frameIndexRef.current;
      frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;

      // Draw the new frame (pass previous frame for disposal handling)
      const nextFrame = frames[frameIndexRef.current];
      const prevFrame = frames[prevIndex];
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (ctx && canvas) {
        drawFrame(ctx, nextFrame, canvas.width, canvas.height, prevFrame);
        canvasTexRef.current.needsUpdate = true;
      }
    }
  });

  // Geometry definitions (memoised)
  const pillarGeom = useMemo(() => new THREE.BoxGeometry(0.6, 6, 0.6), []);
  const beamGeom = useMemo(() => new THREE.BoxGeometry(8, 0.5, 0.5), []);
  const panelGeom = useMemo(() => new THREE.PlaneGeometry(5.5, 4.5), []);

  // Tiered roof slabs
  const roofTiers = useMemo(
    () => [
      { width: 9, height: 0.35, y: 6.6, z: 0 },
      { width: 7.5, height: 0.3, y: 7.2, z: 0 },
      { width: 5.5, height: 0.25, y: 7.7, z: 0 },
    ],
    []
  );

  return (
    <group position={position}>
      {/* ═══════════════════════════════════════════════════════════════════
          A. Base Pillars (2 columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh geometry={pillarGeom} material={pillarMat} position={[-3.5, 3, 0]} />
      <mesh geometry={pillarGeom} material={pillarMat} position={[3.5, 3, 0]} />

      {/* Pillar bases (wider footings) */}
      <mesh position={[-3.5, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.3, 1.0]} />
        <meshStandardMaterial color="#8b7355" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[3.5, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.3, 1.0]} />
        <meshStandardMaterial color="#8b7355" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          B. Cross Beam
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh geometry={beamGeom} material={pillarMat} position={[0, 6.2, 0]} />

      {/* ═══════════════════════════════════════════════════════════════════
          C. Tiered Roof Layers
          ═══════════════════════════════════════════════════════════════════ */}
      {roofTiers.map((tier, i) => (
        <mesh key={`roof-${i}`} position={[0, tier.y, tier.z]}>
          <boxGeometry args={[tier.width, tier.height, 1.2 - i * 0.2]} />
          <meshStandardMaterial color="#8b0000" metalness={0.2} roughness={0.6} emissive="#3a0000" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════════════════════════
          D. Decorative Finials
          ═══════════════════════════════════════════════════════════════════ */}
      <Finial position={[0, 8.2, 0]} />
      <Finial position={[-3.5, 8.0, 0]} />
      <Finial position={[3.5, 8.0, 0]} />
      <Finial position={[-4.2, 6.9, 0]} />
      <Finial position={[4.2, 6.9, 0]} />

      {/* ═══════════════════════════════════════════════════════════════════
          E. Central Projection Panel (Animated GIF Texture)
          ═══════════════════════════════════════════════════════════════════ */}
      <mesh ref={panelMeshRef} geometry={panelGeom} material={fallbackMat} position={[0, 3.2, 0.05]} />
      {/* Back face */}
      <mesh ref={panelMeshBackRef} geometry={panelGeom} material={fallbackMat} position={[0, 3.2, -0.05]} rotation={[0, Math.PI, 0]} />

      {/* ═══════════════════════════════════════════════════════════════════
          F. Panel Frame Border
          ═══════════════════════════════════════════════════════════════════ */}
      {/* Top */}
      <mesh position={[0, 5.55, 0]}>
        <boxGeometry args={[5.8, 0.15, 0.15]} />
        <meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[5.8, 0.15, 0.15]} />
        <meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Left */}
      <mesh position={[-2.85, 3.2, 0]}>
        <boxGeometry args={[0.15, 4.85, 0.15]} />
        <meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Right */}
      <mesh position={[2.85, 3.2, 0]}>
        <boxGeometry args={[0.15, 4.85, 0.15]} />
        <meshStandardMaterial color="#daa520" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════
          G. Shrine Lighting
          ═══════════════════════════════════════════════════════════════════ */}
      <pointLight
        color="#ffaa00"
        intensity={4}
        distance={25}
        decay={1.5}
        position={[0, 4, 1.5]}
      />
      <pointLight
        color="#ff8800"
        intensity={2}
        distance={15}
        decay={2}
        position={[0, 1, 2]}
      />
      {/* Subtle ground illumination */}
      <spotLight
        color="#ffcc44"
        intensity={1.5}
        distance={12}
        angle={Math.PI / 4}
        penumbra={0.8}
        position={[0, 8, 0]}
        target-position={[0, 0, 0]}
      />
    </group>
  );
}
