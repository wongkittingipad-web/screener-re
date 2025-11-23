import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from "../constants";
import { Candle } from "../types";

let aiClient: GoogleGenAI | null = null;

const initClient = () => {
    const key = getApiKey();
    if (key && !aiClient) {
        aiClient = new GoogleGenAI({ apiKey: key });
    }
    return aiClient;
};

export const analyzeChartPattern = async (symbol: string, candles: Candle[]): Promise<string> => {
    const client = initClient();
    if (!client) return "API Key missing. Please configure GEMINI_API_KEY.";

    // Summarize data to reduce token usage
    const recentCandles = candles.slice(-30);
    const dataSummary = recentCandles.map(c => 
        `D:${new Date(c.time * 1000).toISOString().split('T')[0]} O:${c.open.toFixed(2)} H:${c.high.toFixed(2)} L:${c.low.toFixed(2)} C:${c.close.toFixed(2)} V:${c.volume}`
    ).join('\n');

    const prompt = `
    You are a veteran technical analyst. Analyze the following OHLCV data for ${symbol}.
    
    Data (Last 30 periods):
    ${dataSummary}

    Provide a concise technical analysis including:
    1. Primary Trend (Bullish/Bearish/Neutral)
    2. Key Support & Resistance Levels
    3. Potential Chart Patterns (Head & Shoulders, Flags, etc.)
    4. Volume analysis (Accumulation/Distribution)
    
    Keep the tone professional and objective.
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a specialized financial analyst AI.",
                thinkingConfig: { thinkingBudget: 0 } // Fast response preferred
            }
        });
        return response.text || "No analysis generated.";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "Failed to generate analysis. Check API Key or quota.";
    }
};

export const smartScreener = async (query: string): Promise<{ symbol: string, name: string, reason: string }[]> => {
    const client = initClient();
    if (!client) throw new Error("API Key missing");

    const prompt = `Identify 5-8 stock symbols that match this description: "${query}". 
    Return a strict JSON array. Each object should have 'symbol', 'name', and 'reason' (very brief why).`;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            symbol: { type: Type.STRING },
                            name: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Screener Error:", error);
        return [];
    }
};