import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, CompanionRole, GameState } from "../types";
import {
  MessageSquare,
  Send,
  Sparkles,
  BookOpen,
  User,
  Zap,
  RotateCcw
} from "lucide-react";

interface CompanionChatProps {
  currentStoryText: string;
  currentQuest: string;
  characterName: string;
  characterClass: string;
  characterBackground?: string;
  currentInventory: any[];
}

export default function CompanionChat({
  currentStoryText,
  currentQuest,
  characterName,
  characterClass,
  characterBackground,
  currentInventory
}: CompanionChatProps) {
  const [role, setRole] = useState<CompanionRole>("companion");
  const [messages, setMessages] = useState<{ [key in CompanionRole]: ChatMessage[] }>({
    dm: [],
    companion: [],
    scroll: []
  });
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, role]);

  // Boot up initial speech greeting on mount of dynamic role
  useEffect(() => {
    if (messages[role].length === 0) {
      triggerInitialGreeting();
    }
  }, [role]);

  const triggerInitialGreeting = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/adventure/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleType: role,
          chatHistory: [],
          currentStoryText,
          currentQuest,
          characterName,
          characterClass,
          characterBackground,
          currentInventory
        })
      });

      if (!response.ok) {
        throw new Error("Companion is currently fast asleep.");
      }

      const data = await response.json();
      const initialMessage: ChatMessage = {
        id: "init-" + role,
        sender: "companion",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => ({
        ...prev,
        [role]: [initialMessage]
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setInputValue("");

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "player",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistically update player message
    const updatedHistory = [...messages[role], userMessage];
    setMessages(prev => ({
      ...prev,
      [role]: updatedHistory
    }));

    setLoading(true);

    try {
      // Map list for server containing { sender, text }
      const serverHistory = updatedHistory.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const response = await fetch("/api/adventure/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleType: role,
          chatHistory: serverHistory,
          currentStoryText,
          currentQuest,
          characterName,
          characterClass,
          characterBackground,
          currentInventory
        })
      });

      if (!response.ok) {
        throw new Error("The network ether is blocked.");
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: "companion",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => ({
        ...prev,
        [role]: [...prev[role], botMessage]
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: "companion",
        text: "The communication crystal has shattered. Please verify your magic keys or network environment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => ({
        ...prev,
        [role]: [...prev[role], errorMessage]
      }));
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages(prev => ({
      ...prev,
      [role]: []
    }));
    triggerInitialGreeting();
  };

  const getRoleDesc = (t: CompanionRole) => {
    switch (t) {
      case "dm": return "The Sage DM: Ancient wisdom, lore interpretations, and hints.";
      case "companion": return "Elda: Your brave, loyal, protective sword companion.";
      case "scroll": return "Talking Scroll: A snarky, comedic spell book carried on your back.";
    }
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-none flex flex-col backdrop-blur-md overflow-hidden relative" id="companion-chat-root" style={{ height: "450px" }}>
      {/* HEADER SECTION */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-slate-300 font-bold text-xs uppercase font-mono tracking-wider">Companion Broadcasts</h3>
        </div>
        <button
          onClick={resetChat}
          className="p-1 px-2 text-[10px] text-slate-400 hover:text-indigo-450 hover:text-indigo-400 font-mono flex items-center gap-1 bg-slate-900 rounded-none border border-slate-800 hover:border-indigo-500/20 transition-all font-semibold active:scale-95"
          title="Reset current conversation"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          Mute/Reset
        </button>
      </div>

      {/* ROLE SELECTOR CHANNELS */}
      <div className="flex bg-slate-950/40 p-1 border-b border-slate-800">
        {(["companion", "dm", "scroll"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`flex-1 py-1 text-[10px] font-mono uppercase tracking-wider font-bold transition-all border-b-2 rounded-none ${
              role === r
                ? "border-indigo-500 text-indigo-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {r === "companion" ? "Elda" : r === "dm" ? "Sage DM" : "Mischief Scroll"}
          </button>
        ))}
      </div>

      {/* COMPANION INFO BAR */}
      <div className="px-4 py-2 bg-slate-950/20 border-b border-slate-800/10 text-[9px] text-slate-500 font-mono truncate">
        {getRoleDesc(role)}
      </div>

      {/* CHAT MESSAGES PANEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-950/10" ref={scrollRef}>
        {messages[role].map((msg) => {
          const isPlayer = msg.sender === "player";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 max-w-[85%] ${
                isPlayer ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div className={`p-1.5 rounded-none border text-xs shrink-0 ${
                isPlayer 
                  ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-400" 
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300"
              }`}>
                {isPlayer ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div className={`space-y-0.5 min-w-0 ${isPlayer ? "text-right" : "text-left"}`}>
                <div className={`text-[10px] font-bold font-mono tracking-wide ${isPlayer ? "text-indigo-400" : "text-slate-400"}`}>
                  {isPlayer ? "You" : role === "companion" ? "Elda" : role === "dm" ? "Sage DM" : "Spell Scroll"}
                </div>
                <div className={`text-xs px-3.5 py-2.5 rounded-none leading-relaxed break-words shadow-sm ${
                  isPlayer 
                    ? "bg-indigo-650 bg-indigo-600 text-slate-100 font-medium" 
                    : "bg-slate-950 border border-slate-800 text-slate-200"
                }`}>
                  {msg.text}
                </div>
                <div className="text-[8px] text-slate-650 text-slate-500 font-mono tracking-wider">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-slate-500 mr-auto max-w-[85%]">
            <div className="p-1.5 rounded-none bg-slate-800 border border-slate-700 text-indigo-400 animate-pulse">
              <Zap className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold font-mono">Companion is writing...</div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT CONTROLS */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          placeholder={`Chat with ${role === 'companion' ? 'Elda' : role === 'dm' ? 'the Sage DM' : 'the spell scroll'}...`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-505 focus:border-indigo-550 focus:border-indigo-500 text-xs px-3.5 py-2.5 rounded-none text-slate-200 outline-none placeholder:text-slate-600 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-100 rounded-none transition-all cursor-pointer font-bold shrink-0 border border-indigo-400/40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
