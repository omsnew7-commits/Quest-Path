import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { GameState } from "../types";

export interface AmbientAudioType {
  isPlaying: boolean;
  volume: number;
  activePreset: string;
  presetDescription: string;
  togglePlayback: () => void;
  setVolume: (v: number) => void;
  analyserNode: AnalyserNode | null;
  heartbeatRate: number; // Speed up heartbeat if danger/tension is detected
  isTense: boolean;
}

const AmbientAudioContext = createContext<AmbientAudioType | undefined>(undefined);

export function useAmbientAudio() {
  const context = useContext(AmbientAudioContext);
  if (!context) {
    throw new Error("useAmbientAudio must be used within an AmbientAudioProvider");
  }
  return context;
}

interface ProviderProps {
  children: React.ReactNode;
  gameState: GameState | null;
}

export function AmbientAudioProvider({ children, gameState }: ProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem("ambient_synth_volume");
      return saved ? parseFloat(saved) : 0.4;
    } catch {
      return 0.4;
    }
  });

  const [activePreset, setActivePreset] = useState("Sanctuary Idle");
  const [presetDescription, setPresetDescription] = useState("Vivid ambient space waiting for adventure genesis");
  const [isTense, setIsTense] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Background looping nodes reference to prevent overlaps and stop them cleanly
  const activeSources = useRef<any[]>([]);
  const intervalIds = useRef<NodeJS.Timeout[]>([]);

  // Sound scheduler and heartbeat rate
  const heartbeatRate = isTense ? 140 : 70; // BPM

  // Save volume preference
  const setVolume = (val: number) => {
    const fixedVal = Math.max(0, Math.min(1, val));
    setVolumeState(fixedVal);
    localStorage.setItem("ambient_synth_volume", String(fixedVal));
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(fixedVal, audioCtxRef.current.currentTime);
    }
  };

  // Safe lazy initiation of Audio Nodes (requires user-interaction to bypass browsers security guards)
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const masterGain = ctx.createGain();
      const analyser = ctx.createAnalyser();

      analyser.fftSize = 64;
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);

      // Connect master output: Source nodes -> Master Gain -> Analyser -> Speakers
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      analyserRef.current = analyser;

      console.log("🔊 Ambient Audio Synthesis Engine activated successfully.");
    } catch (e) {
      console.error("Failed to construct Web Audio context:", e);
    }
  };

  const togglePlayback = async () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isPlaying) {
      // Pause
      ctx.suspend();
      setIsPlaying(false);
      clearPlayLoops();
    } else {
      // Resume
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      setIsPlaying(true);
      playPresetLoops();
    }
  };

  // Clean all existing active synthesizer nodes and timers
  const clearPlayLoops = () => {
    intervalIds.current.forEach(id => clearInterval(id));
    intervalIds.current = [];

    activeSources.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSources.current = [];
  };

  // Dynamic state parsing: Matches theme, locations, and triggers ambient adaptations
  useEffect(() => {
    if (!gameState) {
      setActivePreset("Quiet Tavern");
      setPresetDescription("Attuning to localized standard leyline oscillations...");
      setIsTense(false);
      return;
    }

    const theme = (gameState.theme || "Medieval Fantasy").toLowerCase();
    const locName = (gameState.currentLocation?.name || "").toLowerCase();
    const locDesc = (gameState.currentLocation?.description || "").toLowerCase();
    const storyText = (gameState.storyText || "").toLowerCase();

    // Danger / tension keyword scanning
    const hasDanger = 
      storyText.includes("danger") || 
      storyText.includes("combat") || 
      storyText.includes("attack") || 
      storyText.includes("threat") || 
      storyText.includes("creature") || 
      storyText.includes("vicious") ||
      storyText.includes("monster") ||
      storyText.includes("hostile");

    setIsTense(hasDanger);

    // Let's settle the best matched ambient environmental track
    if (theme.includes("cyberpunk")) {
      setActivePreset("Neural Neon Grid");
      setPresetDescription("Pulsing synthwave database. Telemetry loops and network clock pulses.");
    } else if (theme.includes("scifi") || theme.includes("space")) {
      setActivePreset("Interstellar Engine");
      setPresetDescription("Deep electromagnetic reactor humming. Static solar wind sweepwaves.");
    } else if (theme.includes("horror") || theme.includes("cosmic")) {
      setActivePreset("Void Whispers");
      setPresetDescription("Drifting detuned cosmic bell-pads. Sanity shifts and shivering waves.");
    } else if (theme.includes("pirate") || theme.includes("sea")) {
      setActivePreset("Siren Tides");
      setPresetDescription("Rhythmic ocean tide crashes. Creaking maritime boards and wind surf.");
    } else {
      // Medieval Fantasy & General
      const isCave = 
        locName.includes("cave") || locName.includes("crypt") || locName.includes("dungeon") || 
        locName.includes("abyss") || locDesc.includes("depths") || locDesc.includes("shadowy") ||
        locName.includes("tomb") || locName.includes("temple");

      if (isCave) {
        setActivePreset("Lost Crypt Resonance");
        setPresetDescription("Deep dark cavern rumblings. Isolated echoing water split-dripping.");
      } else {
        setActivePreset("Serene Glade");
        setPresetDescription("Relaxing lowpass wind drafts. Shimmering pentatonic woodland crystal bells.");
      }
    }
  }, [gameState?.currentLocation?.name, gameState?.theme, gameState?.storyText, gameState?.weather]);

  // Restart sound matrix when active preset, danger level, or weather changes, if playing
  useEffect(() => {
    if (isPlaying) {
      playPresetLoops();
    }
  }, [activePreset, isTense, isPlaying, gameState?.weather]);

  // Handle active audio loops
  const playPresetLoops = () => {
    clearPlayLoops();
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    // Helper: Create a loopable White Noise buffer (useful for wind & waves)
    const createNoiseSource = (filterQ = 1.0, baseFreq = 500) => {
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = filterQ;
      filter.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Low frequency oscillator (LFO) to sweeps the filter
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08 + Math.random() * 0.1, ctx.currentTime);
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(baseFreq * 0.5, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      
      source.connect(filter);

      lfo.start();
      activeSources.current.push(lfo);

      return { source, filter };
    };

    // Synthesize Heartbeat/War-Drum for tense situations
    if (isTense) {
      const heartbeatInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);

        osc.type = "sine";
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(62, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.start(now);
        osc.stop(now + 0.25);

        // Double beat (systole/diastole)
        setTimeout(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(master);

          osc2.type = "sine";
          const now2 = ctx.currentTime;
          osc2.frequency.setValueAtTime(58, now2);
          osc2.frequency.exponentialRampToValueAtTime(10, now2 + 0.15);

          gain2.gain.setValueAtTime(0.0, now2);
          gain2.gain.linearRampToValueAtTime(0.18, now2 + 0.01);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.22);

          osc2.start(now2);
          osc2.stop(now2 + 0.25);
        }, 160);

      }, (60 / heartbeatRate) * 1000);

      intervalIds.current.push(heartbeatInterval);
    }

    // --- WEATHER SYSTEM INTEGRATION ---
    const currentWeather = (gameState?.weather || "Clear").toLowerCase();

    if (currentWeather === "rain") {
      // 1. Continuous rain noise (White noise with a highpass + lowpass filtered bank to resemble rain)
      try {
        const { source, filter } = createNoiseSource(0.5, 1200);
        filter.type = "bandpass";
        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.012, ctx.currentTime);
        filter.connect(rainGain);
        rainGain.connect(master);
        source.start();
        activeSources.current.push(source);

        // 2. Random rain drops clicking
        const rainInterval = setInterval(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") return;
          const osc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          osc.connect(dropGain);
          dropGain.connect(master);

          osc.type = "sine";
          const now = ctx.currentTime;
          osc.frequency.setValueAtTime(1500 + Math.random() * 800, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

          dropGain.gain.setValueAtTime(0, now);
          dropGain.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.01, now + 0.002);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

          osc.start(now);
          osc.stop(now + 0.02);
        }, 120 + Math.random() * 150);
        intervalIds.current.push(rainInterval);
      } catch (e) {
        console.error("Rain synth failed", e);
      }

    } else if (currentWeather === "storm") {
      // 1. Heavy rain noise
      try {
        const { source: rSource, filter: rFilter } = createNoiseSource(0.4, 800);
        rFilter.type = "bandpass";
        const rainGain = ctx.createGain();
        rainGain.gain.setValueAtTime(0.022, ctx.currentTime);
        rFilter.connect(rainGain);
        rainGain.connect(master);
        rSource.start();
        activeSources.current.push(rSource);

        // 2. Severe howling wind noise (low frequency sweeps)
        const { source: wSource, filter: wFilter } = createNoiseSource(4.0, 250);
        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.035, ctx.currentTime);
        wFilter.connect(windGain);
        windGain.connect(master);
        wSource.start();
        activeSources.current.push(wSource);

        // 3. Random lightning/thunder crash
        const thunderInterval = setInterval(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") return;
          if (Math.random() > 0.4) return; // 40% chance every 10 seconds

          const thunderGain = ctx.createGain();
          thunderGain.connect(master);

          const now = ctx.currentTime;
          
          // Crack - sudden short burst of noise
          const { source: crashSrc, filter: crashFlt } = createNoiseSource(1.0, 150);
          crashFlt.connect(thunderGain);
          crashSrc.start(now);
          activeSources.current.push(crashSrc);

          // Deep low rumble osc
          const rumbleOsc = ctx.createOscillator();
          const rumbleGain = ctx.createGain();
          rumbleOsc.connect(rumbleGain);
          rumbleGain.connect(master);
          
          rumbleOsc.type = "sine";
          rumbleOsc.frequency.setValueAtTime(45 + Math.random() * 15, now);
          rumbleOsc.frequency.linearRampToValueAtTime(25, now + 2.5);

          rumbleGain.gain.setValueAtTime(0, now);
          rumbleGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

          // Thunder crack envelope
          thunderGain.gain.setValueAtTime(0, now);
          thunderGain.gain.linearRampToValueAtTime(0.05, now + 0.01);
          thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

          rumbleOsc.start(now);
          rumbleOsc.stop(now + 3.0);
          
          setTimeout(() => {
            try { crashSrc.stop(); } catch {}
          }, 3000);

        }, 10000);
        intervalIds.current.push(thunderInterval);
      } catch (e) {
        console.error("Storm synth failed", e);
      }

    } else if (currentWeather === "fog") {
      // 1. Dense mist breeze (Soft lowpass noise sweep)
      try {
        const { source, filter } = createNoiseSource(1.5, 180);
        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0.015, ctx.currentTime);
        filter.connect(windGain);
        windGain.connect(master);
        source.start();
        activeSources.current.push(source);

        // 2. Slow deep distance foghorn or low frequency chime every 18 seconds
        const hornInterval = setInterval(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") return;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const hornGain = ctx.createGain();

          osc1.connect(hornGain);
          osc2.connect(hornGain);
          hornGain.connect(master);

          const now = ctx.currentTime;
          osc1.type = "triangle";
          osc1.frequency.setValueAtTime(55, now); // Low fundamental
          
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(110.3, now); // Second harmonic with detune

          hornGain.gain.setValueAtTime(0, now);
          hornGain.gain.linearRampToValueAtTime(0.04, now + 1.2);
          hornGain.gain.setValueAtTime(0.04, now + 2.8);
          hornGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 5.0);
          osc2.stop(now + 5.0);
        }, 18000);
        intervalIds.current.push(hornInterval);
      } catch (e) {
        console.error("Fog synth failed", e);
      }
    }

    // --- PRESETS SYNTHESIZERS ---

    if (activePreset === "Serene Glade") {
      // 1. Organic Wind Rustle
      const { source, filter } = createNoiseSource(3.5, 300);
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.025, ctx.currentTime);
      filter.connect(windGain);
      windGain.connect(master);
      source.start();
      activeSources.current.push(source);

      // 2. Scheduled Pentatonic Crystal Bells
      const bellInterval = setInterval(() => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const bellGain = ctx.createGain();
        
        osc1.connect(bellGain);
        osc2.connect(bellGain);
        bellGain.connect(master);

        const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // Pentatonic major
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const now = ctx.currentTime;
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(freq, now);
        
        // Harmonic overlay
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(freq * 2.01, now); 

        bellGain.gain.setValueAtTime(0, now);
        bellGain.gain.linearRampToValueAtTime(0.03, now + 0.01);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + Math.random() * 1.5);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 3.0);
        osc2.stop(now + 3.0);
      }, 3500);

      intervalIds.current.push(bellInterval);

    } else if (activePreset === "Lost Crypt Resonance") {
      // 1. Ultra low sub-dungeon drone (35Hz & 42Hz)
      const droneOsc1 = ctx.createOscillator();
      const droneOsc2 = ctx.createOscillator();
      const droneGain = ctx.createGain();
      
      droneOsc1.connect(droneGain);
      droneOsc2.connect(droneGain);
      droneGain.connect(master);

      droneOsc1.type = "sine";
      droneOsc2.type = "triangle";

      droneOsc1.frequency.setValueAtTime(45, ctx.currentTime);
      droneOsc2.frequency.setValueAtTime(45.5, ctx.currentTime); // detune beats

      // slow volume wave
      const droneLfo = ctx.createOscillator();
      droneLfo.frequency.setValueAtTime(0.05, ctx.currentTime);
      const droneLfoGain = ctx.createGain();
      droneLfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
      
      droneLfo.connect(droneLfoGain);
      droneLfoGain.connect(droneGain.gain);

      droneGain.gain.setValueAtTime(0.04, ctx.currentTime);

      droneOsc1.start();
      droneOsc2.start();
      droneLfo.start();

      activeSources.current.push(droneOsc1, droneOsc2, droneLfo);

      // 2. Dripping Water droplets
      const dripInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const dripGain = ctx.createGain();
        osc.connect(dripGain);
        dripGain.connect(master);

        osc.type = "sine";
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

        dripGain.gain.setValueAtTime(0, now);
        dripGain.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.04, now + 0.004);
        dripGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

        osc.start(now);
        osc.stop(now + 0.08);
      }, 2200 + Math.random() * 1500);

      intervalIds.current.push(dripInterval);

    } else if (activePreset === "Neural Neon Grid") {
      // 1. Synth bass sequence (Arpeggiator at 120BPM)
      let step = 0;
      const cyberInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const synthGain = ctx.createGain();

        osc.connect(filter);
        filter.connect(synthGain);
        synthGain.connect(master);

        osc.type = "sawtooth";
        filter.type = "lowpass";
        filter.Q.value = 5;

        const baseFrequencies = [55.00, 55.00, 65.41, 55.00, 73.42, 65.41, 48.99, 41.20]; // A1, C2, D2, G1, E1
        const index = step % baseFrequencies.length;
        const baseFreq = baseFrequencies[index];

        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        // sweeping lowpass filter
        filter.frequency.setValueAtTime(120, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.1);
        filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);

        synthGain.gain.setValueAtTime(0, ctx.currentTime);
        synthGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
        synthGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);

        // Cyber glitched ping noises occasionally
        if (Math.random() < 0.15) {
          const chirpOsc = ctx.createOscillator();
          const chirpGain = ctx.createGain();
          chirpOsc.connect(chirpGain);
          chirpGain.connect(master);

          chirpOsc.type = "square";
          chirpOsc.frequency.setValueAtTime(3000 + Math.random() * 1500, ctx.currentTime);
          chirpOsc.frequency.setValueAtTime(100, ctx.currentTime + 0.02);

          chirpGain.gain.setValueAtTime(0, ctx.currentTime);
          chirpGain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 0.002);
          chirpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

          chirpOsc.start();
          chirpOsc.stop(ctx.currentTime + 0.04);
        }

        step++;
      }, 400);

      intervalIds.current.push(cyberInterval);

    } else if (activePreset === "Interstellar Engine") {
      // 1. Low deep hollow reactor rumble (80Hz & 81Hz triangle combo)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const engineGain = ctx.createGain();

      osc1.connect(engineGain);
      osc2.connect(engineGain);
      engineGain.connect(master);

      osc1.type = "triangle";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(70.0, ctx.currentTime);
      osc2.frequency.setValueAtTime(70.2, ctx.currentTime); // phase beats

      engineGain.gain.setValueAtTime(0.035, ctx.currentTime);

      osc1.start();
      osc2.start();

      activeSources.current.push(osc1, osc2);

      // 2. High solar bleeps
      const beaconInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const beaconGain = ctx.createGain();
        osc.connect(beaconGain);
        beaconGain.connect(master);

        osc.type = "sine";
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(880 * 2, now);
        
        beaconGain.gain.setValueAtTime(0, now);
        beaconGain.gain.linearRampToValueAtTime(0.015, now + 0.05);
        beaconGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.5);
      }, 5000);

      intervalIds.current.push(beaconInterval);

    } else if (activePreset === "Void Whispers") {
      // 1. Ethereal detuned shifting major chords
      const chords = [
        [110, 137.5, 165], // A major
        [116.54, 146.83, 174.61], // Bb minor (dissonance)
        [98, 123.47, 146.83], // G major
        [110, 130.81, 165]  // A minor
      ];

      let chordIndex = 0;
      const playNextPadChord = () => {
        const now = ctx.currentTime;
        const notes = chords[chordIndex % chords.length];

        notes.forEach((freq) => {
          const oscA = ctx.createOscillator();
          const oscB = ctx.createOscillator();
          const padGain = ctx.createGain();

          oscA.connect(padGain);
          oscB.connect(padGain);
          padGain.connect(master);

          oscA.type = "triangle";
          oscB.type = "sine";

          oscA.frequency.setValueAtTime(freq - 0.5, now);
          oscB.frequency.setValueAtTime(freq + 0.5, now);

          padGain.gain.setValueAtTime(0, now);
          padGain.gain.linearRampToValueAtTime(0.022, now + 1.5);
          padGain.gain.setValueAtTime(0.022, now + 3.0);
          padGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

          oscA.start(now);
          oscB.start(now);
          oscA.stop(now + 6.0);
          oscB.stop(now + 6.0);
        });

        chordIndex++;
      };

      // Trigger immediately and schedule every 5 seconds
      playNextPadChord();
      const padInterval = setInterval(playNextPadChord, 5000);
      intervalIds.current.push(padInterval);

    } else if (activePreset === "Siren Tides") {
      // 1. Surging sea tides (noise filter swept over 6s intervals)
      const { source, filter } = createNoiseSource(1.2, 450);
      const waveGain = ctx.createGain();
      
      filter.connect(waveGain);
      waveGain.connect(master);
      source.start();
      activeSources.current.push(source);

      // Sweep maritime surf volume up and down
      const volumeLfo = ctx.createOscillator();
      volumeLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8 second cycle
      const volumeLfoGain = ctx.createGain();
      volumeLfoGain.gain.setValueAtTime(0.015, ctx.currentTime);
      
      volumeLfo.connect(volumeLfoGain);
      // Offset base volume
      waveGain.gain.setValueAtTime(0.02, ctx.currentTime);
      volumeLfoGain.connect(waveGain.gain);

      volumeLfo.start();
      activeSources.current.push(volumeLfo);

      // 2. Creaking timber ticks
      const creakInterval = setInterval(() => {
        const osc = ctx.createOscillator();
        const creakGain = ctx.createGain();
        osc.connect(creakGain);
        creakGain.connect(master);

        osc.type = "triangle";
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(40 + Math.random() * 20, now);
        osc.frequency.linearRampToValueAtTime(10, now + 0.4);

        creakGain.gain.setValueAtTime(0, now);
        creakGain.gain.linearRampToValueAtTime(0.02, now + 0.05);
        creakGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.45);
      }, 4500 + Math.random() * 3000);

      intervalIds.current.push(creakInterval);
    }
  };

  // Cleanup upon unmount
  useEffect(() => {
    return () => {
      clearPlayLoops();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <AmbientAudioContext.Provider
      value={{
        isPlaying,
        volume,
        activePreset,
        presetDescription,
        togglePlayback,
        setVolume,
        analyserNode: analyserRef.current,
        heartbeatRate,
        isTense
      }}
    >
      {children}
    </AmbientAudioContext.Provider>
  );
}
