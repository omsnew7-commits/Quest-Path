import React, { useState, useEffect } from "react";
import { GameState } from "./types";
import ThemeSelector from "./components/ThemeSelector";
import Sidebar from "./components/Sidebar";
import CompanionChat from "./components/CompanionChat";
import GameConsole from "./components/GameConsole";
import { Sparkles, RefreshCw, LogOut, Terminal, Compass } from "lucide-react";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [state, setState] = useState<GameState>({
    theme: "",
    artStyle: "",
    imageSize: "1K",
    characterName: "",
    characterClass: "",
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
  }) => {
    setLoading(true);
    try {
      // 1. Fetch initial narrative
      const startRes = await fetch("/api/adventure/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      if (!startRes.ok) {
        throw new Error("Unable to contact the DM oracle.");
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
        history: [{ narrative: startData.storyText, action: "Awoken" }]
      };

      setState(finalState);
      setGameActive(true);
      saveStateToStorage(finalState);
    } catch (e: any) {
      alert("Encounter setup failed: " + (e?.message || "Verify system configurations."));
    } finally {
      setLoading(false);
    }
  };

  const handleMakeChoice = async (choice: string) => {
    setLoading(true);
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
        throw new Error("The Dungeon Master block didn't respond.");
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
        history: [...state.history, { narrative: stepData.storyText, action: choice }]
      };

      setState(finalState);
      saveStateToStorage(finalState);
    } catch (e: any) {
      alert("Story progress failed: " + (e?.message || "Please try again."));
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

  return (
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

        {gameActive && (
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded text-slate-400">
              STEP <span className="text-indigo-400 font-bold">{state.stepCount}</span>
            </div>
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-rose-400 bg-slate-900/50 hover:bg-rose-950/20 px-3 py-1.5 rounded border border-slate-805 border-slate-800 hover:border-rose-500/35 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Abandon Journey
            </button>
          </div>
        )}
      </header>

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-h-0" id="main-canvas">
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
              />
              <CompanionChat
                currentStoryText={state.storyText}
                currentQuest={state.questUpdate}
                characterName={state.characterName}
                characterClass={state.characterClass}
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
          <ThemeSelector onStart={handleStartGame} loading={loading} />
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

    </div>
  );
}
