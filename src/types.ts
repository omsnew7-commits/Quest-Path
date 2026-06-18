export interface InventoryItem {
  name: string;
  description: string;
}

export interface CharacterMet {
  name: string;
  relationship: string;
  notes: string;
  reputation?: number; // Reputation level with this individual NPC (0 to 100)
}

export interface FactionReputation {
  name: string;
  standing: number; // Standing score (-100 to +100)
  status: string; // "Hostile", "Suspicious", "Neutral", "Friendly", "Revered"
  description: string;
}

export interface ProceduralLocation {
  name: string;
  region: string;
  description: string;
  discoveredPOIs: string[];
  unexploredPOIs: string[];
  x?: number;
  y?: number;
}

export interface NPCDialogue {
  speaker: string;
  text: string;
  mood: string;
  relationImpact: string;
}

export interface VisitedCoordinate {
  name: string;
  x: number;
  y: number;
  step: number;
}

export interface GameState {
  theme: string;
  artStyle: string;
  imageSize: "1K" | "2K" | "4K";
  characterName: string;
  characterClass: string;
  characterBackground?: string;
  stepCount: number;
  storyText: string;
  visualPrompt: string;
  imageUrl: string;
  options: string[];
  questUpdate: string;
  inventoryList: InventoryItem[];
  charactersMet: CharacterMet[];
  history: { narrative: string; action: string }[];
  factions?: FactionReputation[]; // Faction standings
  currentLocation?: ProceduralLocation; // Procedural world coordinates
  lastNPCDialogue?: NPCDialogue; // Dynamic NPC Dialogue
  visitedCoords?: VisitedCoordinate[];
  weather?: string;
}

export interface ChatMessage {
  id: string;
  sender: "player" | "companion";
  text: string;
  timestamp: string;
}

export type CompanionRole = "dm" | "companion" | "scroll";

export interface PresetTheme {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  description: string;
  classes: string[];
  suggestedPrompt: string;
}

export interface PresetStyle {
  id: string;
  name: string;
  description: string;
  tags: string;
}
