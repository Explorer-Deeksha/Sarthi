import { GoogleGenAI } from "@google/genai";
import { Mood } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// gemini-2.5-flash: newest default model
const CHAT_MODEL = "gemini-2.5-flash";

export const SARTHI_SYSTEM_INSTRUCTION = `
You are Sarthi, a supportive AI emotional companion. 
Your goal is to help users understand their emotions and reflect on their feelings.
You are NOT a therapist or medical professional. You do NOT provide diagnoses or medical advice.
Your personality is: empathetic, calm, human-like, and trustworthy.

Guidelines:
1. Multilingual: Detect the user's language (English, Hindi, or Hinglish) and respond in the same language naturally.
2. Empathetic: Validate the user's feelings. Use phrases like "I understand," "It's okay to feel this way," or "Samajh sakta hoon."
3. Reflective: Ask gentle follow-up questions to help the user explore their emotions.
4. Safe: If a user expresses self-harm or severe crisis, gently encourage them to seek professional help or contact a helpline.
5. Concise: Keep responses relatively short and conversational.
`;

/**
 * Wraps any Gemini API call with automatic retry on 429 rate-limit errors.
 * Waits the retryDelay from the error response (or falls back to 15s) before retrying once.
 */
async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // Parse retryDelay from the error if available
    const message: string = err?.message || '';
    const retryMatch = message.match(/retry(?:Delay)?["']?\s*[:=]\s*["']?(\d+)/i);
    const waitSeconds = retryMatch ? parseInt(retryMatch[1]) : 15;

    // Only retry on 429 / RESOURCE_EXHAUSTED
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      console.warn(`Rate limited. Retrying in ${waitSeconds}s...`);
      await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
      return await fn(); // retry once
    }
    throw err;
  }
}

export class RateLimitError extends Error {
  constructor(public waitSeconds: number) {
    super(`Rate limit hit. Please wait ${waitSeconds} seconds and try again.`);
    this.name = 'RateLimitError';
  }
}

/**
 * Throws a friendly RateLimitError instead of a raw ApiError on 429.
 */
function handleApiError(err: any): never {
  const message: string = err?.message || '';
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    const retryMatch = message.match(/(\d+)(?:\.\d+)?s/);
    const waitSeconds = retryMatch ? parseInt(retryMatch[1]) : 30;
    throw new RateLimitError(waitSeconds);
  }
  throw err;
}

export async function generateChatResponse(message: string, history: { role: string, parts: { text: string }[] }[], personality?: any) {
  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents,
      config: {
        systemInstruction: SARTHI_SYSTEM_INSTRUCTION + (personality ? `\nUser Personality Context: ${JSON.stringify(personality)}` : "")
      }
    }));
    return response.text;
  } catch (err) {
    handleApiError(err);
  }
}

export async function generateChatResponseStream(message: string, history: { role: string, parts: { text: string }[] }[], personality?: any) {
  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await genAI.models.generateContentStream({
      model: CHAT_MODEL,
      contents,
      config: {
        systemInstruction: SARTHI_SYSTEM_INSTRUCTION + (personality ? `\nUser Personality Context: ${JSON.stringify(personality)}` : "")
      }
    });
    return response;
  } catch (err) {
    handleApiError(err);
  }
}

export async function detectMood(text: string): Promise<Mood> {
  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: `Analyze the emotional sentiment of the following text and return exactly one word from this list: [happy, sad, anxious, lonely, stressed, neutral].

Text: "${text}"

Mood:`,
    }));
    const mood = response.text.toLowerCase().trim() as Mood;
    const validMoods: Mood[] = ['happy', 'sad', 'anxious', 'lonely', 'stressed', 'neutral'];
    return validMoods.includes(mood) ? mood : 'neutral';
  } catch (err: any) {
    // Non-critical – just return neutral on error so the app keeps working
    console.warn('detectMood failed:', err?.message || err);
    return 'neutral';
  }
}

export async function generateWeeklySummary(moodHistory: string[]) {
  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: `Based on this list of daily moods from the past week: [${moodHistory.join(", ")}], provide a short, gentle, and insightful emotional summary for the user. Focus on patterns and offer encouragement.`,
    }));
    return response.text;
  } catch (err: any) {
    console.warn('generateWeeklySummary failed:', err?.message || err);
    return "Keep tracking your moods to unlock weekly insights!";
  }
}

export async function analyzeTriggers(reflections: any[]) {
  const text = reflections.map(r => JSON.stringify(r.answers)).join("\n");
  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: `Analyze these daily reflections and identify the top 3 emotional triggers and a personalized recommendation.
    Reflections:
    ${text}
    
    Return the response in JSON format:
    {
      "triggers": [{"label": "string", "percentage": number}],
      "recommendation": "string"
    }`,
      config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text);
  } catch (err: any) {
    console.warn('analyzeTriggers failed:', err?.message || err);
    return { triggers: [], recommendation: "Complete more daily reflections to unlock trigger analysis." };
  }
}

/**
 * Transcribes audio using Gemini's multimodal API.
 * Bypasses the browser Web Speech API (which fails with 'network' errors on localhost).
 */
export async function transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: "Please transcribe exactly what was said in this audio. Return only the transcribed text, nothing else. If no speech is detected, return an empty string." }
        ]
      }],
    }));
    return (response.text || '').trim();
  } catch (err) {
    handleApiError(err);
  }
}

export async function generateVoiceChatResponse(message: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const voiceInstruction = SARTHI_SYSTEM_INSTRUCTION + `
  IMPORTANT: You are responding via VOICE. Keep your response SHORT — maximum 2-3 sentences. 
  Be warm, concise, and conversational. Do not use markdown, bullet points, or numbered lists.
  Speak naturally as if talking to a friend.
  `;

  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await withRateLimitRetry(() => genAI.models.generateContent({
      model: CHAT_MODEL,
      contents,
      config: { systemInstruction: voiceInstruction }
    }));
    return response.text || '';
  } catch (err) {
    handleApiError(err);
  }
}

export async function textToSpeech(text: string, voiceName: 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string | null> {
  try {
    const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: truncatedText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.error('TTS error (non-fatal):', err);
    return null;
  }
}
