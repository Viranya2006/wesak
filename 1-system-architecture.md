# 1. System Architecture & Tech Stack Core

## Target Framework
- Framework: Next.js (App Router, React 19 compliance).
- Styling Utility: TailwindCSS (Utility-first configuration).
- 3D Graphics Foundation: Three.js wrapped within React Three Fiber (R3F) and @react-three/drei helper libraries.
- VFX Engine Pipeline: @pmndrs/postprocessing (Optimized WebGL Pass Manager).
- Motion Interpolation: GSAP (GreenSock Animation Platform) for high-performance camera matrix transitions.

## Directory Structure Strategy
The agent must initialize the codebase according to this strict layout tree:
src/
├── app/
│   ├── layout.js          # Core document styling and font weights
│   └── page.js            # Entry landing system featuring HTML overlay overlays
├── components/
│   ├── CanvasContainer.jsx # R3F isolated Canvas node hook
│   ├── Atapattama.jsx     # Master 3D Sri Lankan Kudu structure geometry
│   ├── SparkParticles.jsx # Custom GPU-driven instanced ambient particles
│   ├── PostEffects.jsx    # Postprocessing Bloom and Lens artifacts layer
│   └── AudioController.jsx # Web Audio API Context and Positional Node triggers
└── hooks/
    └── useSupabaseSync.js # Edge listener real-time stream binding