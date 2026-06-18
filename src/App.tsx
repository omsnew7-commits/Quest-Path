import React, { useState, useEffect } from "react";
import { GameState } from "./types";
import ThemeSelector from "./components/ThemeSelector";
import Sidebar from "./components/Sidebar";
import CompanionChat from "./components/CompanionChat";
import MiniMap from "./components/MiniMap";
import GameConsole from "./components/GameConsole";
import AuthModal from "./components/AuthModal";
import SaveManager from "./components/SaveManager";
import { auth, onAuthStateChanged, db } from "./lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw, LogOut, Terminal, Compass, Shield, Save, Trophy } from "lucide-react";
import { AmbientAudioProvider } from "./components/AmbientAudioContext";
import AmbientAudioWidget from "./components/AmbientAudioWidget";
import FeatsOfValor from "./components/FeatsOfValor";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(() => {
    try {
      const savedMock = localStorage.getItem("mock_user_session");
      return savedMock ? JSON.parse(savedMock) : null;
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saveManagerOpen, setSaveManagerOpen] = useState(false);
  const [featsModalOpen, setFeatsModalOpen] = useState(false);
  
  const [state, setState] = useState<GameState>({
    theme: "",
    artStyle: "",
    imageSize: "1K",
    characterName: "",
    characterClass: "",
    characterBackground: "",
    stepCount: 1,
    storyText: "",
    visualPrompt: "",
    imageUrl: "",
    options: [],
    questUpdate: "",
    inventoryList: [],
    charactersMet: [],
    history: []
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<{
    show: boolean;
    message: string;
    isError: boolean;
  }>({ show: false, message: "", isError: false });
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const playBeepSound = (success: boolean) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (success) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Ignored if browser policy blocks instant playback
    }
  };

  const handleAutoSave = async () => {
    if (!gameActive || !state.theme) return;
    if (!user) {
      setAutoSaveStatus({
        show: true,
        message: "Connect Identity Leyline first to lock cloud snapshots!",
        isError: true,
      });
      playBeepSound(false);
      return;
    }

    setIsAutoSaving(true);
    setAutoSaveStatus({
      show: true,
      message: "Syncing timeline auto-save snapshot...",
      isError: false,
    });

    try {
      const savePayload = {
        userId: user.uid,
        name: `Auto-saved Step ${state.stepCount}`,
        theme: state.theme,
        characterName: state.characterName,
        characterClass: state.characterClass,
        stepCount: state.stepCount,
        savedAt: Timestamp.now(),
        state: state
      };

      await addDoc(collection(db, "saves"), savePayload);
      
      setAutoSaveStatus({
        show: true,
        message: `Reality snapshot locked: Auto-saved Step ${state.stepCount}!`,
        isError: false,
      });
      playBeepSound(true);
    } catch (err: any) {
      console.error("Auto-save write error: ", err);
      setAutoSaveStatus({
        show: true,
        message: "Failed to sync auto-save snapshot.",
        isError: true,
      });
      playBeepSound(false);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Autohide auto-save notification
  useEffect(() => {
    if (autoSaveStatus.show && !isAutoSaving) {
      const timer = setTimeout(() => {
        setAutoSaveStatus((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [autoSaveStatus.show, isAutoSaving]);

  // Keyboard shortcut listener: Ctrl + S / Cmd + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isS = e.key.toLowerCase() === "s";
      const isModifier = e.ctrlKey || e.metaKey;
      
      if (isS && isModifier && gameActive) {
        e.preventDefault();
        handleAutoSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameActive, state, user]);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem("mock_user_session");
      } else {
        const savedMock = localStorage.getItem("mock_user_session");
        if (!savedMock) {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogOut = () => {
    auth.signOut().catch((e) => console.warn("Firebase signout error:", e));
    localStorage.removeItem("mock_user_session");
    setUser(null);
  };

  // Attempt to resume from local storage on render
  useEffect(() => {
    const saved = localStorage.getItem("infinite_adventure_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storyText && parsed.theme) {
          setState(parsed);
          setGameActive(true);
        }
      } catch (e) {
        console.error("Local storage restoration failed:", e);
      }
    }
  }, []);

  // Sync state to local storage
  const saveStateToStorage = (newState: GameState) => {
    localStorage.setItem("infinite_adventure_state", JSON.stringify(newState));
  };

  const handleStartGame = async (config: {
    theme: string;
    artStyle: string;
    imageSize: "1K" | "2K" | "4K";
    characterName: string;
    characterClass: string;
    characterBackground?: string;
  }) => {
    setLoading(true);
    setSystemError(null);
    try {
      // 1. Fetch initial narrative
      const startRes = await fetch("/api/adventure/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      if (!startRes.ok) {
        const errJson = await startRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Unable to contact the DM oracle.");
      }

      const startData = await startRes.json();

      // 2. Fetch opening landscape artwork
      const imageRes = await fetch("/api/adventure/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: startData.visualPrompt,
          artStyle: config.artStyle,
          imageSize: config.imageSize
        })
      });

      let loadedImageUrl = "";
      if (imageRes.ok) {
        const imgData = await imageRes.json();
        loadedImageUrl = imgData.imageUrl;
      }

      const finalState: GameState = {
        theme: config.theme,
        artStyle: config.artStyle,
        imageSize: config.imageSize,
        characterName: config.characterName,
        characterClass: config.characterClass,
        characterBackground: config.characterBackground || "",
        stepCount: 1,
        storyText: startData.storyText,
        visualPrompt: startData.visualPrompt,
        imageUrl: loadedImageUrl,
        options: startData.options,
        questUpdate: startData.questUpdate,
        inventoryList: startData.inventoryList || [],
        charactersMet: startData.charactersMet || [],
        factions: startData.factions || [],
        currentLocation: startData.currentLocation || undefined,
        lastNPCDialogue: startData.lastNPCDialogue || undefined,
        history: [{ narrative: startData.storyText, action: "Awoken" }],
        visitedCoords: [
          {
            name: startData.currentLocation?.name || "The Beginning",
            x: startData.currentLocation?.x ?? 0,
            y: startData.currentLocation?.y ?? 0,
            step: 1
          }
        ]
      };

      setState(finalState);
      setGameActive(true);
      saveStateToStorage(finalState);
    } catch (e: any) {
      console.error("Game start failed:", e);
      setSystemError(e?.message || "Verify system configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeChoice = async (choice: string) => {
    setLoading(true);
    setSystemError(null);
    try {
      // 1. Move story narrative step forward
      const stepRes = await fetch("/api/adventure/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: state.theme,
          artStyle: state.artStyle,
          characterClass: state.characterClass,
          characterName: state.characterName,
          characterBackground: state.characterBackground,
          choice,
          previousHistory: state.history,
          currentInventory: state.inventoryList,
          currentCharacters: state.charactersMet,
          currentQuest: state.questUpdate,
          currentFactions: state.factions,
          currentLocation: state.currentLocation
        })
      });

      if (!stepRes.ok) {
        const errJson = await stepRes.json().catch(() => ({}));
        throw new Error(errJson.error || "The Dungeon Master block didn't respond.");
      }

      const stepData = await stepRes.json();

      // 2. Refresh dynamic widescreen artwork matching visualPrompt
      const imageRes = await fetch("/api/adventure/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: stepData.visualPrompt,
          artStyle: state.artStyle,
          imageSize: state.imageSize
        })
      });

      let loadedImageUrl = state.imageUrl; // fallback to previous on error
      if (imageRes.ok) {
        const imgData = await imageRes.json();
        loadedImageUrl = imgData.imageUrl;
      }

      const finalState: GameState = {
        ...state,
        stepCount: state.stepCount + 1,
        storyText: stepData.storyText,
        visualPrompt: stepData.visualPrompt,
        imageUrl: loadedImageUrl,
        options: stepData.options,
        questUpdate: stepData.questUpdate,
        inventoryList: stepData.inventoryList || [],
        charactersMet: stepData.charactersMet || [],
        factions: stepData.factions || state.factions,
        currentLocation: stepData.currentLocation || state.currentLocation,
        lastNPCDialogue: stepData.lastNPCDialogue || undefined,
        history: [...state.history, { narrative: stepData.storyText, action: choice }],
        visitedCoords: [
          ...(state.visitedCoords || []),
          {
            name: stepData.currentLocation?.name || "Unknown Area",
            x: stepData.currentLocation?.x ?? state.currentLocation?.x ?? 0,
            y: stepData.currentLocation?.y ?? state.currentLocation?.y ?? 0,
            step: state.stepCount + 1
          }
        ]
      };

      setState(finalState);
      saveStateToStorage(finalState);
    } catch (e: any) {
      console.error("Story progress failed:", e);
      setSystemError(e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    if (confirm("Are you sure you want to abandon the current adventure? Your inventory logs will be lost.")) {
      localStorage.removeItem("infinite_adventure_state");
      setState({
        theme: "",
        artStyle: "",
        imageSize: "1K",
        characterName: "",
        characterClass: "",
        characterBackground: "",
        stepCount: 1,
        storyText: "",
        visualPrompt: "",
        imageUrl: "",
        options: [],
        questUpdate: "",
        inventoryList: [],
        charactersMet: [],
        history: []
      });
      setGameActive(false);
    }
  };

  const handleLoadSaveState = (loadedState: GameState) => {
    setState(loadedState);
    saveStateToStorage(loadedState);
    setGameActive(true);
    setSaveManagerOpen(false);
  };

  return (
    <AmbientAudioProvider gameState={gameActive && state.theme ? state : null}>
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col p-4 md:p-6" id="app-viewport">
      
      {/* GLOBAL HUD / NAVBAR */}
      <header className="border-b border-slate-800/80 pb-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none shrink-0" id="global-navbar">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 filter drop-shadow-md rounded-none">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-slate-100 font-sans uppercase flex items-center gap-1.5">
              Infinite Adventure Engine
              <span className="text-[9px] px-2 py-0.5 bg-slate-800 rounded-none text-slate-400 font-mono tracking-widest uppercase font-bold border border-slate-700">
                NEXUS
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">
              GEOMETRIC BALANCE REAL-TIME CHOICE SYNTHESIZER
            </p>
          </div>
        </div>

        {gameActive ? (
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded text-slate-400">
              STEP <span className="text-indigo-400 font-bold">{state.stepCount}</span>
            </div>

            <button
              onClick={() => setFeatsModalOpen(true)}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-100 hover:text-amber-300 bg-amber-955 bg-amber-950/45 hover:bg-amber-900/35 px-3 py-1.5 rounded border border-amber-600/40 hover:border-amber-400 transition-all cursor-pointer active:scale-95 shadow-[0_0_8px_rgba(245,158,11,0.08)]"
              id="header-feats-valor-btn"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Feats of Valor
            </button>
            
            <button
              onClick={() => setSaveManagerOpen(true)}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-indigo-400 bg-slate-900/50 hover:bg-indigo-950/20 px-3 py-1.5 rounded border border-slate-800 hover:border-indigo-500/35 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              Reality Anchors
            </button>

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-rose-450 bg-slate-900/50 hover:bg-rose-950/20 px-3 py-1.5 rounded border border-slate-800 hover:border-rose-500/35 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Abandon Journey
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  OPERATIVE: <span className="text-indigo-400 font-bold uppercase">{user.displayName || user.email || "Aligned"}</span>
                </span>
                <button
                  onClick={() => {
                    if (confirm("Disconnect identity leyline?")) {
                      handleLogOut();
                    }
                  }}
                  className="text-xs font-mono font-semibold text-slate-400 hover:text-rose-450 bg-slate-900/50 hover:bg-rose-950/20 px-3 py-1.5 rounded border border-slate-800 hover:border-rose-500/35 transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/30 hover:bg-indigo-900/40 px-3 py-1.5 rounded border border-indigo-900 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Connect Identity Leyline
              </button>
            )}
          </div>
        )}
      </header>

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-h-0" id="main-canvas">
        {systemError && (
          <div className="mb-6 p-5 bg-rose-950/30 border border-rose-900/50 text-rose-100 font-mono text-xs space-y-3 rounded relative" id="system-error-card">
            <button
              onClick={() => setSystemError(null)}
              className="absolute top-4 right-4 text-rose-400 hover:text-rose-250 hover:underline cursor-pointer text-[10px] uppercase font-bold tracking-widest"
            >
              ✕ DISMISS
            </button>
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              DECISION ORACLE DIAGNOSTIC REPORT
            </div>
            <div className="space-y-2 leading-relaxed">
              <p className="text-slate-250 font-bold text-slate-200">
                {systemError}
              </p>
              {(systemError.toLowerCase().includes("leaked") || 
                systemError.toLowerCase().includes("api key") || 
                systemError.toLowerCase().includes("permission") || 
                systemError.toLowerCase().includes("denied")) && (
                <div className="text-[11px] bg-slate-900/80 p-4 border border-slate-800 text-slate-300 space-y-2 leading-relaxed rounded mt-1">
                  <p className="font-bold text-indigo-400 uppercase tracking-wider">🔒 DEPLOYMENT RESTORATION PROCEDURE:</p>
                  <p>
                    The underlying Gemini API Key has been reported as publicly leaked or compromised. Safe-guards have locked authorization.
                  </p>
                  <p className="font-semibold text-emerald-400">
                    Resolution: Please go to Google AI Studio's top Settings or key manager menu to provision and configure a fresh active "GEMINI_API_KEY" secret.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {gameActive ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 items-stretch">
            
            {/* Left Status side panels: Inventory + Multi-turn Companions */}
            <div className="col-span-1 md:col-span-4 flex flex-col gap-6 h-full min-h-0 shrink-0">
              <Sidebar
                characterName={state.characterName}
                characterClass={state.characterClass}
                stepCount={state.stepCount}
                questUpdate={state.questUpdate}
                inventoryList={state.inventoryList}
                charactersMet={state.charactersMet}
                theme={state.theme}
                factions={state.factions}
                weather={state.weather}
                onOpenFeats={() => setFeatsModalOpen(true)}
              />
              <AmbientAudioWidget />
              <MiniMap state={state} />
              <CompanionChat
                currentStoryText={state.storyText}
                currentQuest={state.questUpdate}
                characterName={state.characterName}
                characterClass={state.characterClass}
                characterBackground={state.characterBackground}
                currentInventory={state.inventoryList}
              />
            </div>

            {/* Central Main Console taking remaining space */}
            <div className="col-span-1 md:col-span-8 flex flex-col h-full min-h-0">
              <GameConsole
                state={state}
                onChoice={handleMakeChoice}
                loading={loading}
                gameActive={gameActive}
                onRestart={handleRestart}
              />
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <ThemeSelector onStart={handleStartGame} loading={loading} />
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Authenticate / Account Status Card */}
              <div className="bg-slate-900/40 border border-slate-800 p-5 font-mono space-y-3">
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Operative Session
                </div>
                {user ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-405 text-slate-400">
                      Aligned as <span className="text-indigo-455 text-indigo-400 font-bold">{user.displayName || user.email || "Chronicle Wanderer"}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Your dimensional snapshot save leylines are synchronized dynamically.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm("Disconnect identity leyline?")) {
                          handleLogOut();
                        }
                      }}
                      className="text-[10px] text-rose-455 text-rose-400 hover:underline cursor-pointer uppercase font-semibold block"
                    >
                      Disconnect Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Sync timelines, cloud backups, and restore saved checkpoints instantly.
                    </p>
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="text-[10px] text-indigo-455 text-indigo-400 hover:underline cursor-pointer font-bold uppercase tracking-wider"
                    >
                      Establish Connection
                    </button>
                  </div>
                )}
              </div>

              {/* Ambient Audio Synth leyline */}
              <AmbientAudioWidget />

              {/* Save Game Manager */}
              <SaveManager 
                user={user} 
                currentState={state.theme ? state : null} 
                onLoadState={handleLoadSaveState} 
                openAuth={() => setAuthModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* SUBTLE SYSTEM STATUS FOOTER */}
      <footer className="border-t border-slate-850 border-slate-800/40 mt-6 pt-4 text-[9px] text-slate-600 font-mono flex flex-col sm:flex-row justify-between items-center gap-2 select-none shrink-0" id="global-footer">
        <div>
          ACTIVE DESKTOP INTERFACE CONTAINER • PORT 3000 INGRESS APPROVED
        </div>
        <div>
          DESIGN LANGUAGE: GEOMETRIC BALANCE • POWERED BY GEMINI-3-PRO-IMAGE & @GOOGLE/GENAI
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onAuthSuccess={(u) => {
          setUser(u);
          setAuthModalOpen(false);
        }} 
      />

      {/* FEATS OF VALOR ACHIEVEMENTS DASHBOARD */}
      <FeatsOfValor
        state={gameActive ? state : null}
        isOpen={featsModalOpen}
        onClose={() => setFeatsModalOpen(false)}
      />

      {/* FLOATING ACTION AUTO-SAVE STATUS IN PROGRESS TOAST */}
      <AnimatePresence>
        {autoSaveStatus.show && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 shadow-2xl font-mono text-xs border tracking-wide select-none ${
              autoSaveStatus.isError
                ? "bg-rose-950/95 border-rose-600/60 text-rose-200"
                : "bg-slate-900/95 border-indigo-505 border-indigo-500/80 text-indigo-200"
            }`}
            id="autosave-float-indicator"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isAutoSaving && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  autoSaveStatus.isError ? "bg-rose-500" : "bg-indigo-400 animate-pulse"
                }`}></span>
              </span>
              <span>{autoSaveStatus.message}</span>
            </div>
            
            <button
              onClick={() => setAutoSaveStatus((prev) => ({ ...prev, show: false }))}
              className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer ml-1 pl-1.5 border-l border-slate-800"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE SIDE OVERLAY FOR KEEPSAVES */}
      {saveManagerOpen && gameActive && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in" id="save-manager-overlay">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 relative flex flex-col space-y-4" id="save-manager-overlay-card">
            
            <button 
              onClick={() => setSaveManagerOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer p-1 transition-all"
            >
              ✕
            </button>
            
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block font-mono">
                DIMENSIONAL ANCHORS PANEL
              </span>
              <h2 className="text-slate-100 text-sm font-bold uppercase font-mono tracking-wider">
                Lock or Load Timelines
              </h2>
            </div>

            <SaveManager 
              user={user} 
              currentState={state} 
              onLoadState={handleLoadSaveState} 
              openAuth={() => {
                setSaveManagerOpen(false);
                setAuthModalOpen(true);
              }}
            />
            
            <button 
              onClick={() => setSaveManagerOpen(false)}
              className="w-full py-2.5 bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer uppercase"
            >
              Return to Active Adventure
            </button>
          </div>
        </div>
      )}

    </div>
    </AmbientAudioProvider>
  );
}
