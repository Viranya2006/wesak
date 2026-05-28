import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostEffects() {
  return (
    <EffectComposer disableNormalPass multisampling={4}>
      {/* 1. Selective Unreal Bloom (Correction 3) */}
      <Bloom 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.05}
        intensity={1.2} 
        radius={0.6} 
        mipmapBlur
      />

      {/* 2. Soft Corner Vignette */}
      <Vignette 
        offset={0.3} 
        darkness={0.75} 
        eskil={false} 
        blendFunction={BlendFunction.NORMAL} 
      />

      {/* 3. Micro Film Grain (Opacity capped at 0.02) */}
      <Noise 
        opacity={0.018} // slightly below 0.02 cap
        blendFunction={BlendFunction.OVERLAY} 
      />
    </EffectComposer>
  );
}
