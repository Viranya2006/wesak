'use client';

import React, { useRef, useCallback, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// VirtualJoystick — glassmorphic touch-pad overlay for open-world navigation
// Renders as a fixed HTML overlay (NOT inside R3F Canvas).
// Outputs normalized direction vector { x: [-1,1], y: [-1,1] } via onMove().
// ─────────────────────────────────────────────────────────────────────────────

const RING_SIZE = 120;       // Outer ring diameter (px)
const HANDLE_SIZE = 44;      // Inner gold handle diameter (px)
const MAX_OFFSET = (RING_SIZE - HANDLE_SIZE) / 2; // Max handle displacement

export default function VirtualJoystick({ onMove }) {
  const baseRef = useRef(null);
  const [handlePos, setHandlePos] = useState({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });

  const getPointerPos = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX, y: touch.clientY };
  };

  const handleStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    activeRef.current = true;

    if (baseRef.current && e.pointerId !== undefined) {
      baseRef.current.setPointerCapture(e.pointerId);
    }

    const rect = baseRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const handleMove = useCallback((e) => {
    if (!activeRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const pos = getPointerPos(e);
    let dx = pos.x - centerRef.current.x;
    let dy = pos.y - centerRef.current.y;

    // Clamp within ring radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_OFFSET) {
      dx = (dx / dist) * MAX_OFFSET;
      dy = (dy / dist) * MAX_OFFSET;
    }

    // Update visual handle position
    setHandlePos({ x: dx, y: dy });

    // Normalize to [-1, 1] and emit
    // Note: y is inverted (screen down = forward in 3D)
    if (onMove) {
      onMove({
        x: dx / MAX_OFFSET,
        y: -dy / MAX_OFFSET,
      });
    }
  }, [onMove]);

  const handleEnd = useCallback((e) => {
    e.preventDefault();
    activeRef.current = false;
    if (baseRef.current && e.pointerId !== undefined) {
      try {
        baseRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    setHandlePos({ x: 0, y: 0 });
    if (onMove) onMove({ x: 0, y: 0 });
  }, [onMove]);

  return (
    <div
      ref={baseRef}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        width: `${RING_SIZE}px`,
        height: `${RING_SIZE}px`,
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '2px solid rgba(245, 158, 11, 0.35)',
        boxShadow: '0 0 30px rgba(245, 158, 11, 0.1), inset 0 0 20px rgba(0,0,0,0.3)',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 60,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Crosshair guides */}
      <div style={{
        position: 'absolute',
        width: '60%',
        height: '1px',
        background: 'rgba(245, 158, 11, 0.12)',
        top: '50%',
        left: '20%',
      }} />
      <div style={{
        position: 'absolute',
        width: '1px',
        height: '60%',
        background: 'rgba(245, 158, 11, 0.12)',
        left: '50%',
        top: '20%',
      }} />

      {/* Direction arrows (subtle) */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '8px',
        color: 'rgba(245, 158, 11, 0.3)',
        fontFamily: 'monospace',
      }}>▲</div>
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '8px',
        color: 'rgba(245, 158, 11, 0.3)',
        fontFamily: 'monospace',
      }}>▼</div>
      <div style={{
        position: 'absolute',
        left: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '8px',
        color: 'rgba(245, 158, 11, 0.3)',
        fontFamily: 'monospace',
      }}>◀</div>
      <div style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '8px',
        color: 'rgba(245, 158, 11, 0.3)',
        fontFamily: 'monospace',
      }}>▶</div>

      {/* Gold handle stick */}
      <div
        style={{
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          borderRadius: '50%',
          background: activeRef.current
            ? 'radial-gradient(circle, #f59e0b 0%, #d97706 60%, #b45309 100%)'
            : 'radial-gradient(circle, rgba(245,158,11,0.8) 0%, rgba(217,119,6,0.5) 60%, rgba(180,83,9,0.3) 100%)',
          border: '2px solid rgba(245, 158, 11, 0.6)',
          boxShadow: '0 0 15px rgba(245, 158, 11, 0.3), 0 2px 8px rgba(0,0,0,0.4)',
          transform: `translate(${handlePos.x}px, ${handlePos.y}px)`,
          transition: activeRef.current ? 'none' : 'transform 0.2s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '8px',
        letterSpacing: '0.15em',
        color: 'rgba(245, 158, 11, 0.4)',
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        MOVE
      </div>
    </div>
  );
}
