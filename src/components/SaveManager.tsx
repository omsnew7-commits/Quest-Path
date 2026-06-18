import React, { useState, useEffect } from "react";
import { 
  Save, 
  Download, 
  Trash2, 
  FileLock, 
  Calendar, 
  Plus, 
  Sparkles,
  Lock,
  Compass
} from "lucide-react";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { GameState } from "../types";

interface SaveManagerProps {
  user: any;
  currentState: GameState | null;
  onLoadState: (loadedState: GameState) => void;
  openAuth: () => void;
}

interface SavedGame {
  id: string;
  name: string;
  theme: string;
  characterName: string;
  characterClass: string;
  stepCount: number;
  savedAt: any;
  state: GameState;
}

export default function SaveManager({ user, currentState, onLoadState, openAuth }: SaveManagerProps) {
  const [saves, setSaves] = useState<SavedGame[]>([]);
  const [saveName, setSaveName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSaves = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "saves"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedSaves: SavedGame[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSaves.push({
          id: doc.id,
          name: data.name,
          theme: data.theme,
          characterName: data.characterName,
          characterClass: data.characterClass,
          stepCount: data.stepCount,
          savedAt: data.savedAt,
          state: data.state
        });
      });
      // Sort client-side in case firestore indexes are building
      fetchedSaves.sort((a, b) => {
        const timeA = a.savedAt?.seconds || 0;
        const timeB = b.savedAt?.seconds || 0;
        return timeB - timeA;
      });
      setSaves(fetchedSaves);
    } catch (err: any) {
      console.error("Firestore read error: ", err);
      setError("Unable to retrieve timeline save states.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSaves();
    } else {
      setSaves([]);
    }
  }, [user]);

  const handleCreateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentState) return;
    if (!saveName.trim()) {
      setError("Please input a code marker name for your save.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const savePayload = {
        userId: user.uid,
        name: saveName.trim(),
        theme: currentState.theme,
        characterName: currentState.characterName,
        characterClass: currentState.characterClass,
        stepCount: currentState.stepCount,
        savedAt: Timestamp.now(),
        state: currentState
      };

      await addDoc(collection(db, "saves"), savePayload);
      setSuccess("Reality snapshot locked successfully!");
      setSaveName("");
      fetchSaves();
    } catch (err: any) {
      console.error("Firestore write error: ", err);
      setError("Failed to synchronize reality snapshot. Retry.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSave = (savedGame: SavedGame) => {
    onLoadState(savedGame.state);
    setSuccess(`Reality aligned to save: "${savedGame.name}"`);
  };

  const handleDeleteSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this reality record? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      await deleteDoc(doc(db, "saves", id));
      setSuccess("Reality slot purged.");
      fetchSaves();
    } catch (err: any) {
      setError("Unable to purge save slot.");
    }
  };

  const formatFirebaseDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 p-6 relative flex flex-col space-y-4 font-mono w-full" id="save-manager-root">
      
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4 text-indigo-400" />
          <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider">
            Leyline Reality Anchors (Games)
          </h3>
        </div>
        {!user && (
          <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse bg-rose-950/20 px-2 py-0.5 border border-rose-800/20">
            <Lock className="w-2.5 h-2.5" /> Synchronicity Locked
          </span>
        )}
      </div>

      {/* ERROR / SUCCESS NOTIFIER */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[10px] leading-relaxed">
          ⚡ EXCEPTION: {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[10px] leading-relaxed">
          ✓ TIMELINE UPDATE: {success}
        </div>
      )}

      {/* USER IS NOT LOGGED IN */}
      {!user ? (
        <div className="p-6 text-center space-y-3 bg-slate-950/40 border border-slate-850">
          <FileLock className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
          <div className="space-y-1">
            <h4 className="text-slate-350 text-xs font-bold uppercase tracking-wider">Synchronize Coordinates</h4>
            <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-normal">
              You must establish an active leyline codename path to authorize read/write cloud snapshots. Supports Email, Phone (SMS), Google, and Apple ID.
            </p>
          </div>
          <button
            onClick={openAuth}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-[10px] uppercase tracking-widest border border-indigo-400/40 cursor-pointer transition-all active:scale-95"
          >
            Authenticate Leyline
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* USER INFO & LOGOUT LINK */}
          <div className="flex items-center justify-between bg-slate-950 p-2.5 border border-slate-850">
            <div className="truncate pr-4">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest block">OPERATIVE LEVEL: ALIGNED</span>
              <span className="text-[10px] text-indigo-400 font-bold truncate block">
                {user.displayName || user.email || "Chronicle Wanderer"}
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm("Disconnect identity leyline? Local session logs will remain.")) {
                  import("../lib/firebase").then(({ signOut, auth }) => {
                    signOut(auth);
                  });
                }
              }}
              className="px-2 py-1 bg-slate-900 border border-slate-800 text-[9px] hover:text-rose-400 font-semibold cursor-pointer uppercase transition-all"
            >
              Disconnect
            </button>
          </div>

          {/* CREATE SAVE REALITY */}
          {currentState ? (
            <form onSubmit={handleCreateSave} className="flex gap-2 bg-slate-950/20 border border-slate-800 p-3">
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={35}
                  placeholder="Reality marker name, e.g. Elven Forest Entry"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  disabled={saving}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !saveName.trim()}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-slate-100 text-[10px] whitespace-nowrap uppercase tracking-wider font-bold border border-indigo-400/40 cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-300" />
                {saving ? "SAVING..." : "LOCK REALITY"}
              </button>
            </form>
          ) : (
            <div className="text-[10px] p-3 text-slate-500 italic bg-slate-950/25 border border-slate-850 text-center">
              Create an adventure first to lock snapshot markers.
            </div>
          )}

          {/* LIST SAVES */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">
              LOCKED SAVED MULTIVERSE SLOTS
            </span>

            {loading ? (
              <p className="text-[10px] text-slate-400 animate-pulse py-4 text-center">
                Querying reality streams from Firebase...
              </p>
            ) : saves.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 text-slate-600">
                <Compass className="w-6 h-6 mx-auto opacity-30 mb-2" />
                <span className="text-[9px] uppercase tracking-widest">No dimensional save points anchored.</span>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    onClick={() => handleLoadSave(save)}
                    className="group bg-slate-950/50 border border-slate-850 hover:border-indigo-550 hover:border-indigo-500 hover:bg-slate-900 transition-all p-3 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-bold text-[11px] truncate uppercase tracking-wide group-hover:text-indigo-300 transition-colors">
                          {save.name}
                        </span>
                        <span className="text-[8px] bg-indigo-950/40 text-indigo-400 border border-indigo-800/40 px-1.5 py-0.2 select-none">
                          STEP {save.stepCount}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-slate-500">
                        <span className="text-slate-400 font-bold" title={save.characterClass}>
                          {save.characterName} ({save.characterClass ? save.characterClass.split(" — ")[0] : "Wanderer"})
                        </span>
                        <span className="scale-75">•</span>
                        <span className="text-indigo-455 text-indigo-400/80 uppercase">{save.theme}</span>
                        <span className="scale-75">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatFirebaseDate(save.savedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        title="Load this reality"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSave(save);
                        }}
                        className="p-1 px-1.5 bg-indigo-950/40 border border-indigo-900 text-indigo-400 hover:bg-indigo-650 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer scale-90"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="De-anchor reality slot"
                        onClick={(e) => handleDeleteSave(save.id, e)}
                        className="p-1 px-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900 transition-all cursor-pointer scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
