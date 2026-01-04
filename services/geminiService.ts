import { GoogleGenAI, Type } from "@google/genai";
import { SensorData, AIInsight } from "../types";

export async function analyzeTrends(recentData: SensorData[], isStale: boolean, ageMinutes: number): Promise<AIInsight> {
  // Always initialize fresh to ensure latest environment variables/keys
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const dataSummary = recentData.map(d => ({
    temp: d.temp,
    hum: d.humidity,
    gas: d.toxicGas,
    co2: d.co2,
    timestamp: d.timestamp
  }));

  const systemInstruction = `You are the EcoGuard AI Core, a highly sophisticated environmental monitoring agent.
Your primary task is to analyze sensor telemetry from ESP32 nodes. 
Be precise, technical, and alert. If data is stale, prioritize diagnosing why the node heartbeat is missing.
You must return your analysis in valid JSON format matching the requested schema.`;

  const prompt = isStale 
    ? `CRITICAL ALERT: Communication heartbeat lost. The sensor data is ${ageMinutes} minutes old. 
       Last recorded state: ${JSON.stringify(dataSummary[dataSummary.length-1])}.
       Analyze this failure. Suggest hardware checks (Power, Wi-Fi, Sensor connection) and warn about the lack of visibility.`
    : `Analyzing real-time telemetry stream: ${JSON.stringify(dataSummary)}.
       Evaluate air quality and environmental stability. If levels are safe, provide a reassuring diagnostic. If rising, warn of potential hazards.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
              type: Type.STRING,
              description: "Brief summary of the environmental state or hazard."
            },
            thoughtProcess: {
              type: Type.STRING,
              description: "Internal monologue reflecting on the data gaps or trends."
            },
            trend: { 
              type: Type.STRING, 
              enum: ['STABLE', 'RISING', 'FALLING']
            },
            confidence: { 
              type: Type.NUMBER,
              description: "Confidence in the analysis from 0 to 1."
            }
          },
          required: ["status", "prediction", "trend", "confidence", "thoughtProcess"]
        }
      }
    });

    const result = response.text;
    if (!result) throw new Error("No response from AI");
    
    return JSON.parse(result.trim()) as AIInsight;
  } catch (error) {
    console.error("Gemini Analysis Failure:", error);
    
    // Fallback insight in case of API failure
    return {
      status: isStale ? 'DANGER' : 'SAFE',
      prediction: isStale 
        ? "Monitoring suspended. Link heartbeat exceeded timeout threshold." 
        : "Automated analysis offline. Manual monitoring required.",
      thoughtProcess: "API connection error. Defaulting to fail-safe safety protocols.",
      trend: 'STABLE',
      confidence: 0
    };
  }
}