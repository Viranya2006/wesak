import { useState, useEffect, useCallback, useRef } from 'react';

// Sourced from traditional Sri Lankan Vesak blessings
const MOCK_BLESSINGS = [
  "May all beings be well, happy, and peaceful.",
  "Suwapath Wewa (May you be healthy and cured).",
  "May the light of Dhamma guide your path.",
  "Sabbe Satta Bhavantu Sukhitattha.",
  "Wishing peace and harmony to the entire world.",
  "May your life be filled with light and wisdom.",
  "Nirogi Wewa (May you have good health).",
  "Ceylon X: Innovating for a brighter future.",
  "May all your righteous wishes be fulfilled.",
  "Wishing happiness and prosperity to all."
];

export function useSupabaseSync() {
  const [blessings, setBlessings] = useState([]);
  const blessingsRef = useRef([]);

  // Generate a random lantern
  const createLantern = useCallback((text, isUserSubmitted = false) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Spawning grid: wide spread horizontally, starting below viewport (y: -10 to -5)
    const x = (Math.random() - 0.5) * 40;
    const y = -15 - Math.random() * 10;
    const z = -10 - Math.random() * 40; // background depth
    
    // Slight upward speed, drift sideways
    const vy = 0.8 + Math.random() * 1.2;
    const vx = (Math.random() - 0.5) * 0.4;
    const vz = (Math.random() - 0.5) * 0.4;

    const scale = 0.5 + Math.random() * 0.8;
    const rotSpeed = (Math.random() - 0.5) * 0.5;

    return {
      id,
      text,
      x,
      y,
      z,
      vx,
      vy,
      vz,
      scale,
      rotSpeed,
      isUserSubmitted,
      color: [1.0, 0.4 + Math.random() * 0.4, 0.1], // warm gold/orange gradient
      progress: 0
    };
  }, []);

  // Initialize with some ambient background lanterns
  useEffect(() => {
    const initial = [];
    for (let i = 0; i < 15; i++) {
      const text = MOCK_BLESSINGS[Math.floor(Math.random() * MOCK_BLESSINGS.length)];
      const lantern = createLantern(text);
      // distribute them vertically so they aren't all at the bottom at the start
      lantern.y = -10 + Math.random() * 30;
      initial.push(lantern);
    }
    blessingsRef.current = initial;
    setBlessings([...initial]);
  }, [createLantern]);

  // Periodic ambient spawning to keep the sky filled
  useEffect(() => {
    const interval = setInterval(() => {
      // Keep active count around 60
      if (blessingsRef.current.length < 20) {
        const text = MOCK_BLESSINGS[Math.floor(Math.random() * MOCK_BLESSINGS.length)];
        const newLantern = createLantern(text);
        blessingsRef.current.push(newLantern);
        setBlessings([...blessingsRef.current]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createLantern]);

  // Method to submit a user blessing
  const submitBlessing = useCallback((text) => {
    if (!text || text.trim() === "") return;
    
    // Spawn user-submitted lantern close to center, slightly below
    const id = Math.random().toString(36).substring(2, 9);
    const userLantern = {
      id,
      text: text.trim(),
      x: (Math.random() - 0.5) * 4,
      y: -6,
      z: -3 - Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.1,
      vy: 1.5 + Math.random() * 0.5, // floats up faster
      vz: (Math.random() - 0.5) * 0.1,
      scale: 1.1, // slightly larger so it stands out
      rotSpeed: 0.3,
      isUserSubmitted: true,
      color: [1.0, 0.2, 0.0], // distinct fiery crimson red/orange
      progress: 0
    };

    blessingsRef.current.push(userLantern);
    setBlessings([...blessingsRef.current]);
    return userLantern;
  }, []);

  return {
    blessings,
    submitBlessing
  };
}
