import { GoogleGenAI, Type } from "@google/genai";
import { Mood } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function generateChatResponse(message: string, history: { role: string, parts: { text: string }[] }[], personality?: any) {
  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: SARTHI_SYSTEM_INSTRUCTION + (personality ? `\nUser Personality Context: ${JSON.stringify(personality)}` : "")
    }
  });

  return response.text;
}

export async function generateChatResponseStream(message: string, history: { role: string, parts: { text: string }[] }[], personality?: any) {
  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await genAI.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: SARTHI_SYSTEM_INSTRUCTION + (personality ? `\nUser Personality Context: ${JSON.stringify(personality)}` : "")
    }
  });

  return response;
}

export async function detectMood(text: string): Promise<Mood> {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the emotional sentiment of the following text and return exactly one word from this list: [happy, sad, anxious, lonely, stressed, neutral].
  
  Text: "${text}"
  
  Mood:`,
  });

  const mood = response.text.toLowerCase().trim() as Mood;

  const validMoods: Mood[] = ['happy', 'sad', 'anxious', 'lonely', 'stressed', 'neutral'];
  return validMoods.includes(mood) ? mood : 'neutral';
}

export async function generateWeeklySummary(moodHistory: string[]) {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on this list of daily moods from the past week: [${moodHistory.join(", ")}], provide a short, gentle, and insightful emotional summary for the user. Focus on patterns and offer encouragement.`,
  });

  return response.text;
}

export async function analyzeTriggers(reflections: any[]) {
  const text = reflections.map(r => JSON.stringify(r.answers)).join("\n");
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these daily reflections and identify the top 3 emotional triggers and a personalized recommendation.
    Reflections:
    ${text}
    
    Return the response in JSON format:
    {
      "triggers": [{"label": "string", "percentage": number}],
      "recommendation": "string"
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text);
}

/**
 * Transcribes audio using Gemini's multimodal API.
 * Accepts base64-encoded audio (webm or ogg from MediaRecorder).
 * This bypasses the browser Web Speech API (which requires Google's servers and can fail with network errors).
 */
export async function transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          }
        },
        { text: "Please transcribe exactly what was said in this audio. Return only the transcribed text, nothing else. If no speech is detected, return an empty string." }
      ]
    }],
  });

  return (response.text || '').trim();
}

export async function generateVoiceChatResponse(message: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const voiceInstruction = SARTHI_SYSTEM_INSTRUCTION + `
  IMPORTANT: You are responding via VOICE. Keep your response SHORT — maximum 2-3 sentences. 
  Be warm, concise, and conversational. Do not use markdown formatting, bullet points, or numbered lists.
  Speak naturally as if talking to a friend.
  `;

  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: voiceInstruction
    }
  });

  return response.text || '';
}

export async function textToSpeech(text: string, voiceName: 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string | null> {
  try {
    // Truncate very long text to avoid TTS errors
    const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: truncatedText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;
  } catch (err) {
    console.error('Text-to-speech error:', err);
    return null;
  }
}
