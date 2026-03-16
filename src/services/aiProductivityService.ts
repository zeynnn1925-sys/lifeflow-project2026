import { GoogleGenAI, Type } from "@google/genai";
import { DailyQuote, AIProductivityPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateDailyQuote(): Promise<DailyQuote> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Give me an inspiring daily quote from a famous person in any field (science, art, business, sports, etc.). Return it in JSON format with text, author, and field.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          author: { type: Type.STRING },
          field: { type: Type.STRING }
        },
        required: ["text", "author", "field"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return {
    id: Math.random().toString(36).substr(2, 9),
    ...data,
    date: new Date().toISOString().split('T')[0]
  };
}

export async function generateAIProductivityPlan(date: string): Promise<AIProductivityPlan> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a high-productivity daily schedule for ${date} from morning to night. For each activity, include a specific 'challenge' to make it more engaging and productive. Return it in JSON format as an array of items with title, startTime, endTime, and challenge.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            challenge: { type: Type.STRING }
          },
          required: ["title", "startTime", "endTime", "challenge"]
        }
      }
    }
  });

  const items = JSON.parse(response.text).map((item: any) => ({
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    completed: false
  }));

  return {
    date,
    items
  };
}
