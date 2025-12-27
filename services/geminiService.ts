
import { GoogleGenAI } from "@google/genai";
import { LevelConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBriefing = async (level: LevelConfig): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a high-intensity, short mission briefing (max 2 sentences) for a racing game level called "${level.name}". Theme: ${level.theme}. You are ARIA, a tactical AI. Be professional but edgy.`,
      config: { temperature: 0.8 }
    });
    return response.text || "Objective: Reach the finish line. Avoid obstacles. Go fast.";
  } catch (error) {
    return "Mission update: Systems nominal. Proceed to destination.";
  }
};

export const generateReaction = async (event: string, theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are ARIA, a tactical racing AI. Provide a VERY SHORT (max 7 words) reactive comment for this event: "${event}". The environment theme is "${theme}". Be witty, encouraging, or slightly critical.`,
      config: { temperature: 1.0, maxOutputTokens: 20 }
    });
    return response.text?.trim() || "Watch it, driver!";
  } catch (error) {
    return "Eyes on the road!";
  }
};
