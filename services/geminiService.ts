import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FractalState, GeminiAnalysis } from "../types";

export const analyzeFractalView = async (state: FractalState): Promise<GeminiAnalysis> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return {
      title: "API Key Missing",
      description: "Please set the REACT_APP_API_KEY environment variable to use the AI features.",
      mathFact: "Cannot connect to neural link."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      I am exploring a fractal.
      Type: ${state.type}
      Center Coordinates: Real: ${state.center.x}, Imaginary: ${state.center.y}
      Zoom Level: ${state.zoom.toExponential(2)}
      
      Provide a short, sci-fi HUD style analysis of this sector.
      1. A cool Title for this region.
      2. A poetic description of the visual complexity (max 2 sentences).
      3. A math fact about this specific location or fractal type (max 1 sentence).
      
      Return in JSON.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        mathFact: { type: Type.STRING }
      },
      required: ["title", "description", "mathFact"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");

    return JSON.parse(text) as GeminiAnalysis;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: "Sector Analysis Failed",
      description: "Interference detected. Unable to retrieve data from the core.",
      mathFact: "System Offline."
    };
  }
};
