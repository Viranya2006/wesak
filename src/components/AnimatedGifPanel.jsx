import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseGIF, decompressFrames } from 'gifuct-js';

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedGifPanel — Reusable animated GIF texture panel for Three.js
// Decodes GIF frames using gifuct-js and plays them on a CanvasTexture.
// ─────────────────────────────────────────────────────────────────────────────

export default function AnimatedGifPanel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 3,
  height = 3,
  visible = true,
}) {
  const meshRef = useRef();
  const gifLoadedRef = useRef(false);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const frameTimerRef = useRef(0);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const canvasTexRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const tempCtxRef = useRef(null);
  const opacityRef = useRef(0);
  const matRef = useRef(null);

  // Panel geometry
  const panelGeom = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height]);

  // Placeholder material (transparent until GIF loads)
  const placeholderMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Load and decode GIF
  useEffect(() => {
    let cancelled = false;

    async function loadGif() {
      try {
        const resp = await fetch(url);
        const buff = await resp.arrayBuffer();
        const gif = parseGIF(buff);
        const frames = decompressFrames(gif, true);

        if (cancelled || frames.length === 0) return;

        const { width: gw, height: gh } = frames[0].dims;
        const canvas = document.createElement('canvas');
        canvas.width = gw;
        canvas.height = gh;
        const ctx = canvas.getContext('2d');

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;

        const gifMat = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
          toneMapped: false,
        });

        if (meshRef.current) meshRef.current.material = gifMat;
        matRef.current = gifMat;

        canvasRef.current = canvas;
        ctxRef.current = ctx;
        canvasTexRef.current = tex;
        framesRef.current = frames;
        frameIndexRef.current = 0;
        frameTimerRef.current = 0;
        gifLoadedRef.current = true;

        // Draw first frame
        drawFrame(ctx, frames[0], null);
        tex.needsUpdate = true;
      } catch (err) {
        console.warn(`AnimatedGifPanel: Failed to load ${url}`, err);
      }
    }

    loadGif();

    return () => {
      cancelled = true;
      if (canvasTexRef.current) canvasTexRef.current.dispose();
    };
  }, [url]);

  // Draw a single GIF frame with proper compositing
  const drawFrame = useCallback((ctx, frame, prevFrame) => {
    const { dims, patch, disposalType } = frame;

    // Handle disposal of previous frame
    if (prevFrame && prevFrame.disposalType === 2) {
      ctx.clearRect(
        prevFrame.dims.left,
        prevFrame.dims.top,
        prevFrame.dims.width,
        prevFrame.dims.height
      );
    }

    // Create temp canvas for patch compositing
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
      tempCtxRef.current = tempCanvasRef.current.getContext('2d');
    }
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCtxRef.current;
    tempCanvas.width = dims.width;
    tempCanvas.height = dims.height;

    const imageData = new ImageData(
      new Uint8ClampedArray(patch),
      dims.width,
      dims.height
    );
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, dims.left, dims.top);
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!gifLoadedRef.current) return;
    const dt = Math.min(delta, 0.1);

    // Smooth opacity fade based on visibility
    const targetOpacity = visible ? 1.0 : 0.0;
    opacityRef.current += (targetOpacity - opacityRef.current) * dt * 3.0;
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current;
    }

    // Only animate frames when visible
    if (opacityRef.current < 0.01) return;

    const frames = framesRef.current;
    if (frames.length === 0) return;

    frameTimerRef.current += delta * 1000;
    const currentFrame = frames[frameIndexRef.current];
    const delay = currentFrame.delay || 100;

    if (frameTimerRef.current >= delay) {
      frameTimerRef.current -= delay;
      const prevIndex = frameIndexRef.current;
      frameIndexRef.current = (frameIndexRef.current + 1) % frames.length;

      const nextFrame = frames[frameIndexRef.current];
      const prevFrame = frames[prevIndex];
      const ctx = ctxRef.current;
      if (ctx) {
        drawFrame(ctx, nextFrame, prevFrame);
        canvasTexRef.current.needsUpdate = true;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={panelGeom}
      material={placeholderMat}
      position={position}
      rotation={rotation}
    />
  );
}
