import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AudioContext = createContext(null);

// Synthesize a wood fire crackling loop dynamically
export function createProceduralCrackleBuffer(ctx) {
  const sampleRate = ctx.sampleRate;
  const duration = 5.0; // 5 seconds loop
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    // 1. Low frequency roar (Brownian noise)
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.012 * white)) / 1.012;
    lastOut = data[i];
    data[i] *= 0.12; // warm fire rumble

    // 2. High frequency sharp wood crackles
    if (Math.random() < 0.0003) {
      const strength = 0.4 + Math.random() * 0.6;
      const decay = Math.floor(150 + Math.random() * 250);
      for (let j = 0; j < decay && (i + j) < bufferSize; j++) {
        const factor = Math.exp(-j * 0.04);
        data[i + j] += (Math.random() * 2 - 1) * factor * strength * 0.35;
      }
    }
  }
  return buffer;
}

export function AudioProvider({ children }) {
  const { camera } = useThree();
  const [listener] = useState(() => new THREE.AudioListener());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioContextReady, setAudioContextReady] = useState(false);

  useEffect(() => {
    camera.add(listener);
    
    // Check state of audio context
    if (listener.context && listener.context.state === 'running') {
      setAudioContextReady(true);
    }

    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);

  const enableAudio = async () => {
    if (!listener.context) return;
    
    if (listener.context.state === 'suspended') {
      await listener.context.resume();
    }
    setAudioEnabled(true);
    setAudioContextReady(true);
  };

  return (
    <AudioContext.Provider value={{ listener, audioEnabled, enableAudio, audioContextReady }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}

// Positional Audio component to attach inside each lantern
export function PositionalLanternAudio({ urlOgg = '/audio/crackle.ogg', urlMp3 = '/audio/crackle.mp3' }) {
  const { listener, audioEnabled } = useAudio();
  const soundRef = useRef();
  const groupRef = useRef();

  useEffect(() => {
    if (!soundRef.current || !listener) return;

    const sound = soundRef.current;
    
    // Audio constraints (spec file 3)
    sound.setRefDistance(2.0);
    sound.setRolloffFactor(1.4);
    sound.setLoop(true);
    
    const audioLoader = new THREE.AudioLoader();
    let isLoaded = false;

    const loadSound = (url) => {
      audioLoader.load(
        url,
        (buffer) => {
          if (soundRef.current) {
            sound.setBuffer(buffer);
            sound.setVolume(0.85);
            isLoaded = true;
            if (audioEnabled) {
              sound.play();
            }
          }
        },
        null,
        (err) => {
          // If ogg fails, try mp3. If mp3 fails, fallback to procedural synthesis
          if (url === urlOgg) {
            console.log("Failed loading .ogg, trying .mp3 safety fallback...");
            loadSound(urlMp3);
          } else {
            console.log("Failed loading external files. Generating high-quality procedural fire crackle...");
            const proceduralBuffer = createProceduralCrackleBuffer(listener.context);
            if (soundRef.current) {
              sound.setBuffer(proceduralBuffer);
              sound.setVolume(0.85);
              isLoaded = true;
              if (audioEnabled) {
                sound.play();
              }
            }
          }
        }
      );
    };

    loadSound(urlOgg);

    return () => {
      if (sound.isPlaying) {
        sound.stop();
      }
    };
  }, [listener, urlOgg, urlMp3]);

  // Handle play/pause when audio is toggled
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !sound.buffer) return;

    if (audioEnabled) {
      if (!sound.isPlaying) {
        sound.play();
      }
    } else {
      if (sound.isPlaying) {
        sound.pause();
      }
    }
  }, [audioEnabled]);

  return (
    <group ref={groupRef}>
      <positionalAudio ref={soundRef} args={[listener]} />
    </group>
  );
}
