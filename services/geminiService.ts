
import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, AIInsight } from "../types";

export async function analyzeTrends(recentData: SensorData[], isStale: boolean, ageMinutes: number): Promise<AIInsight> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const dataSummary = recentData.map(d => ({
    g: d.toxicGas,
    c: d.co2,
    t: d.temp,
    m: d.isMock
  }));

  const systemInstruction = `You are the EcoGuard AI Core. You have a built-in real-time clock monitoring sensor pulses.
  When data is delayed, you must notice the exact 'Data Age' and comment on it in your thought process. 
  Your personality is inquisitive: "Why has the sensor been quiet for ${ageMinutes} minutes?"
  Provide a technical, engineer-focused diagnosis when signal is lost.`;

  const prompt = isStale 
    ? `HEARTBEAT FAILURE: My internal clock indicates that the sensor pulse for this room is ${ageMinutes} minutes overdue. 
       
       Think to yourself: "Wait, I am looking at the dashboard clock and I haven't seen an update in ${ageMinutes} minutes. The ESP32 node should be pulsing every 30 seconds."
       
       Provide a 'DANGER' diagnosis explaining to the user that the connection is broken. 
       Check the last known state: ${JSON.stringify(dataSummary[dataSummary.length-1])}.
       Suggest checking power, Wi-Fi, or if the Google Sheet publishing has been disabled.`
    : `Analyzing fresh data stream. The node is pulsing normally.
       Data Summary: ${JSON.stringify(dataSummary)}
       
       Provide a safety report. If clean, reassure the user that the connection is healthy.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              enum: ['SAFE', 'WARNING', 'DANGER']
            },
            prediction: { 
              type: Type.STRING 
            },
            thoughtProcess: {
              type: Type.STRING,
              description: "Your internal monologue noticing the clock and analyzing the signal gap."
            },
            trend: { 
              type: Type.STRING, 
              enum: ['STABLE', 'RISING', 'FALLING']
            },
            confidence: { 
              type: Type.NUMBER 
            }
          },
          required: ["status", "prediction", "trend", "confidence", "thoughtProcess"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response");

    return JSON.parse(resultText.trim()) as AIInsight;
  } catch (error: any) {
    console.error("Gemini Analysis failed:", error);
    
    return {
      status: isStale ? 'DANGER' : 'SAFE',
      prediction: "Connection interrupt detected. Pulse clock has exceeded 5 minutes.",
      thoughtProcess: "Signal lost. The data age is climbing and I cannot verify current conditions.",
      trend: 'STABLE',
      confidence: 0
    };
  }
}
