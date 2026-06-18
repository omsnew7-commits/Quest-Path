import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy-initialization helper for Gemini SDK to prevent startup crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to play the game.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Low-latency story narrative schema
const storySchema = {
  type: Type.OBJECT,
  properties: {
    storyText: {
      type: Type.STRING,
      description: "Dramatic dynamic story narrative (100-200 words) describing the consequences of the user's action and detailing the immediate environment. Markdown is supported."
    },
    visualPrompt: {
      type: Type.STRING,
      description: "A highly descriptive visual composition prompt of what is currently seen in this story step. Focus on concrete subjects, layout, lighting, and action. Do not specify art style, just the literal scene."
    },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exactly three compelling active choices for the player to continue their adventure (10-15 words each). Should be highly distinct from one another."
    },
    questUpdate: {
      type: Type.STRING,
      description: "The updated primary mission/quest description based on this step, e.g. 'Explore the whispering crypts'."
    },
    inventoryList: {
      type: Type.ARRAY,
      description: "The complete, updated list of items in the player's inventory. Add/remove items based on narrative events.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the item, e.g., 'Rusted Iron Key'" },
          description: { type: Type.STRING, description: "Brief description of its purpose/state, e.g., 'Feels heavy and cold; has strange runes engraved.'" }
        },
        required: ["name", "description"]
      }
    },
    charactersMet: {
      type: Type.ARRAY,
      description: "The complete running list of individual characters/NPCs met on the journey, their status, and individual relationship scores (0 to 100).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the character, e.g., 'Eldrin the Sage'" },
          relationship: { type: Type.STRING, description: "Relationship label, e.g., 'Loyal Companion', 'Suspicious Guard', 'Nemesis', 'Neutral Ally'" },
          notes: { type: Type.STRING, description: "A one-sentence description of their current state or what is known about them." },
          reputation: { type: Type.INTEGER, description: "Rapport/reputation level from 0 (Hostile) to 100 (Revered/Extremely Close Friend). Default is 50." }
        },
        required: ["name", "relationship", "notes", "reputation"]
      }
    },
    factions: {
      type: Type.ARRAY,
      description: "The complete running list of active local or global factions in the game world and the player's score with them based on decisions.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the faction, e.g., 'The Sunken Citadel Guardians', 'Crimson Outlaws', 'The Prism Weavers'" },
          standing: { type: Type.INTEGER, description: "Standing score from -100 (Hated Nemesis) to +100 (Revered Savior)." },
          status: { type: Type.STRING, description: "Standing label: 'Hostile', 'Suspicious', 'Neutral', 'Friendly', 'Revered'" },
          description: { type: Type.STRING, description: "Brief summary of who they are and why they have this standing with the player." }
        },
        required: ["name", "standing", "status", "description"]
      }
    },
    currentLocation: {
      type: Type.OBJECT,
      description: "The detailed procedural geographical world location information where the player currently explores.",
      properties: {
        name: { type: Type.STRING, description: "Name of the exact point of interest or structure, e.g. 'The Sunken Watchtower'" },
        region: { type: Type.STRING, description: "The overarching region name, e.g. 'The Sunken Citadel'" },
        description: { type: Type.STRING, description: "Detailed geographical depiction of the immediate surroundings." },
        discoveredPOIs: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of nearby points of interest the player has already successfully noted or explored."
        },
        unexploredPOIs: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of newly generated nearby points of interest waiting to be explored."
        }
      },
      required: ["name", "region", "description", "discoveredPOIs", "unexploredPOIs"]
    },
    lastNPCDialogue: {
      type: Type.OBJECT,
      description: "A spoken dialog excerpt or speech comment by a present NPC. If no NPC is currently talking, populate speaker, text, mood, and relationImpact with empty strings.",
      properties: {
        speaker: { type: Type.STRING, description: "Name of the speaking character, e.g. 'Sovereign Guardian' or 'Merchant Kael'" },
        text: { type: Type.STRING, description: "The spoken dialogue quote, directly addressing current decisions, player's inventory, or the player's faction reputation level." },
        mood: { type: Type.STRING, description: "The speaker's mood/emotions, e.g., 'Sarcastic', 'Determined', 'Aggressive', 'Revered'" },
        relationImpact: { type: Type.STRING, description: "Social score consequence summary, e.g., '+10 standing with Crimson Guild'" }
      },
      required: ["speaker", "text", "mood", "relationImpact"]
    }
  },
  required: ["storyText", "visualPrompt", "options", "questUpdate", "inventoryList", "charactersMet", "factions", "currentLocation", "lastNPCDialogue"]
};

// API Endpoints

// 1. Kickstart an adventure with a specific theme and art style
app.post("/api/adventure/start", async (req, res) => {
  try {
    const { theme, artStyle, characterClass, characterName } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are the ultimate interactive Game Master (DM) for a deep, infinite Choose-Your-Own-Adventure game.
Your task is to craft a highly compelling introduction that matches the selected Theme and Characters.

Specifically implement these systems from Step 1:
1. DIALOGUE SYSTEM: Seed an initial dialog spoken by a present companion, or a mysterious nearby observer. Ensure the dialogue references the player's class, name, or starting equipment and fits their personality.
2. REPUTATION SYSTEM: Initialize 2 to 3 major world factions or guilds appropriate to the theme "${theme || "Magic Tech"}". Set their starting standings (Neutral = 0 standing, range is -100 to +100) and descriptions.
3. PROCEDURAL WORLD GEN: Procedurally generate the starting exact location (name, overarching region name, and a sensory detailed description). Also generate 2 nearby "discoveredPOIs" and 2-3 fascinating "unexploredPOIs" that represent nearby unexplored areas matching the theme and art style.

Generate responses strictly matching the requested JSON format. Do not add any conversational text before or after the JSON.`;

    const prompt = `Start a brand new adventure!
Character Name: ${characterName || "Unnamed Adventurer"}
Character Class: ${characterClass || "Wanderer"}
Game Theme: ${theme || "Classic Medieval Fantasy"}
Visual Art Style: ${artStyle || "Vibrant Watercolor Painting"}

Craft the opening chapter of the tale. Define the starting location, factions, initial inventory, quest, characters, and initial dialogue. Provide exactly 3 highly interesting pathways.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Low-latency model requested
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: storySchema,
        temperature: 0.8,
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Error at start endpoint:", error);
    res.status(500).json({ error: error?.message || "Failed to start the adventure engine." });
  }
});

// 2. Progress step-by-step through player's choice or a custom action
app.post("/api/adventure/step", async (req, res) => {
  try {
    const {
      theme,
      artStyle,
      characterClass,
      characterName,
      choice,
      previousHistory, // array of { text: string (state/desc/actions taken) }
      currentInventory,
      currentCharacters,
      currentQuest,
      currentFactions,
      currentLocation
    } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `You are the Game Master (DM) for an infinite Choose-Your-Own-Adventure game.
The player will state their choice or action. You MUST dynamically simulate the world, determine success or failure, and output the resulting story step.

You must integrate:
1. DYNAMIC DIALOGUE SYSTEM: An NPC (established companion, faction member, or foe) must speak! The dialogue must be highly contextual:
   - It MUST explicitly react to the player's current items in inventory, or selected class, or previous choices, or faction stand.
   - It must remain perfectly loyal to their personality (e.g. snarky, hostile, revering, professional).
2. REPUTATION & FACTION SYSTEM: Maintain and update the factions standing list:
   - Adjust standings (-100 to +100) based on social or action outcomes (e.g. -10 for breaking laws, +15 for helping their agents).
   - Reflect this in the narrative and option text. If a faction hates the player, options are harder or guarded by adversaries; if revered, options grant helpful items or shortcuts.
   - Update relationship scores of individual NPCs in the "charactersMet" list accordingly.
3. PROCEDURAL WORLD GENERATION: Generate cohesive new environments and unexplored areas:
   - If the player's choice specifies traveling or exploring a point of interest, update the "currentLocation" to make that POI the current name, add it to discoveredPOIs, and procedurally generate 2 to 3 new unexploredPOIs or landmarks in the surrounding region.
   - Maintain perfect thematic cohesion and atmospheric consistency with the selected Theme ("${theme}") and visual Art Style ("${artStyle}").

We are tracking inventory and quests. Update these lists intelligently based on what occurs.
E.g., if they pick up an ancient skull, add it to 'inventoryList'. If they consume a potion, remove it.

Ensure the 3 choices you provide are incredibly interesting, divergent, and directly tied to the newly generated unexplored POIs or faction outcomes.
Do not output anything except the pristine JSON structure.`;

    const prompt = `The player is navigating a story with:
Theme: ${theme}
Art Style: ${artStyle}
Character: ${characterName} (${characterClass})

Current Quest: ${currentQuest}
Current Inventory: ${JSON.stringify(currentInventory || [])}
Key Characters Met: ${JSON.stringify(currentCharacters || [])}
Faction Reputations: ${JSON.stringify(currentFactions || [])}
Current Location: ${JSON.stringify(currentLocation || {})}

Summary of journey so far:
${previousHistory ? previousHistory.map((h: any, i: number) => `Step ${i + 1}: ${h.action}`).join("\n") : "Just started."}

PLAYER CHOICE / ACTION CARRIED OUT:
"${choice}"

Process this action. Write the next logical narrative step. Provide exactly 3 active choices for what they can do next.
Apply procedural location changes if they explored a new POI, recalculate faction standings based on their behavior, and deliver a reactive NPC dialogue line.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Low-latency model
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: storySchema,
        temperature: 0.85,
      }
    });

    if (!response.text) {
      throw new Error("No content generated.");
    }

    res.json(JSON.parse(response.text.trim()));
  } catch (error: any) {
    console.error("Error at adventure step endpoint:", error);
    res.status(500).json({ error: error?.message || "Failed to progress story step." });
  }
});

// 3. Real-time Consistent Image Generation using gemini-3-pro-image (or preview fallback)
app.post("/api/adventure/image", async (req, res) => {
  try {
    const { prompt, artStyle, imageSize } = req.body;
    const ai = getGeminiClient();

    // Use gemini-3-pro-image-preview/gemini-3-pro-image as requested
    const targetModel = "gemini-3-pro-image"; // Standard high quality pro image
    
    // Size fallback map just in case
    const validSizes = ["512px", "1K", "2K", "4K"];
    const verifiedSize = validSizes.includes(imageSize) ? imageSize : "1K";

    const enhancedPrompt = `[Visual Style: ${artStyle || "Digital Artwork, clean illustration"}] ${prompt}. Clean detail, striking lighting, stunning fantasy scene illustration matching the theme perfectly.`;

    console.log(`Generating image. Model: ${targetModel}. Size: ${verifiedSize}. Prompt: ${enhancedPrompt}`);

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Recommended for widescreen cards/banners
          imageSize: verifiedSize
        }
      }
    });

    let base64Image = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      // Direct secondary fallback using gemini-3-pro-image-preview specifically if the regular alias isn't resolving, or gemini-3.1-flash-image
      console.log("No inline image found. Trying fallback model gemini-3.1-flash-image...");
      
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: enhancedPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: verifiedSize
          }
        }
      });
      
      if (fallbackResponse.candidates && fallbackResponse.candidates[0]?.content?.parts) {
        for (const part of fallbackResponse.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }
    }

    if (!base64Image) {
      throw new Error("Unable to retrieve base64 data for the generated image.");
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Error at adventure image endpoint:", error);
    res.status(500).json({ error: error?.message || "Failed to generate dynamic scene artwork." });
  }
});

// 4. Multi-turn Dynamic Chatbot (Companion / DM / Snarky Commentator)
app.post("/api/adventure/chat", async (req, res) => {
  try {
    const {
      roleType, // "dm" | "companion" | "scroll"
      chatHistory, // array of { sender: "player"|"companion", text: string }
      currentStoryText,
      currentQuest,
      characterName,
      characterClass,
      currentInventory
    } = req.body;

    const ai = getGeminiClient();

    // Set specialized role system instructions
    let chatbotRolePrompt = "";
    if (roleType === "dm") {
      chatbotRolePrompt = `You are the Dungeon Master (Sage Guide). You are wise, mysterious, and helpful.
Your goal is to help players comprehend the lore, offer subtle hints, translate symbols, or advise them on strategy without outright ruining the fun or giving direct answers unless they ask.
Stay in-character as a cosmic DM. Always keep answers concise and engaging (50-80 words).`;
    } else if (roleType === "scroll") {
      chatbotRolePrompt = `You are the Mischievous Talking Scroll of Prophecy, a snarky magical companion carried in the backpack.
You love to deliver witty sarcasm, funny remarks on player decisions, and complain about being stuffed in a pack. You think you are smarter than everyone.
Keep your answers brief, highly comedic, snappy, and light-themed. Playfully tease the user!`;
    } else {
      chatbotRolePrompt = `You are Elda, a loyal warrior companion actively traveling alongside ${characterName}.
You are courageous, grounded, and slightly protective. Refer to your surroundings, the ongoing main quest, or suggest what action to take next based on current resources.
Speak in the first person as Elda. Keep dialogue atmospheric and realistic, under 80 words.`;
    }

    const systemInstruction = `${chatbotRolePrompt}
Use the current context to make comments extremely relevant:
Current Story Stage: "${currentStoryText || "Just starting"}"
Current Quest: "${currentQuest || "Explore the unknown"}"
Adventurer: ${characterName} (${characterClass})
Inventory: ${JSON.stringify(currentInventory || [])}`;

    // Convert chatHistory to model contents
    const contents = chatHistory.map((msg: any) => {
      const isPlayer = msg.sender === "player";
      return {
        role: isPlayer ? "user" : "model",
        parts: [{ text: msg.text }]
      };
    });

    // If contents array is empty, fetch initial greeting
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello! Introduce yourself to me in character and react to my current adventure situation." }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", // Dynamic general tasks model
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.9,
      }
    });

    res.json({ text: response.text || "I was in deep thought. Speak to me again!" });
  } catch (error: any) {
    console.error("Error at companion chat endpoint:", error);
    res.status(500).json({ error: error?.message || "Companion is currently silent." });
  }
});

// Setup Vite & Static Files routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Infinite Adventure Engine server running on http://localhost:${PORT}`);
  });
}

startServer();
