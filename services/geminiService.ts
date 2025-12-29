import { GoogleGenAI, Modality } from "@google/genai";
import { TTSConfig, SupportedLanguage } from "../types";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSpeech = async (
  text: string,
  config: TTSConfig
): Promise<string> => {
  // 1. Aggressive Sanitization
  let cleanText = text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!cleanText) {
    throw new Error("Vui lòng nhập văn bản.");
  }

  if (cleanText.length > 4000) {
    throw new Error(`Văn bản quá dài (${cleanText.length} ký tự). Vui lòng cắt nhỏ dưới 4000 ký tự.`);
  }

  try {
    const model = "gemini-2.5-flash-preview-tts";
    
    // Config setup
    let speechConfig: any = {};

    if (config.mode === 'conversation') {
      // Multi-speaker config
      // User must provide text in format that the model understands as conversation
      // We wrap the user prompt to ensure the model follows the speaker definitions
      const prompt = `TTS the following conversation between ${config.speaker1.name} and ${config.speaker2.name}:\n\n${cleanText}`;
      
      // Update cleanText to be this new prompt
      cleanText = prompt;

      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: config.speaker1.name,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker1.voice } }
            },
            {
              speaker: config.speaker2.name,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: config.speaker2.voice } }
            }
          ]
        }
      };
    } else {
      // Single speaker
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: config.voiceName || 'Puck' },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: speechConfig,
      },
    });

    const candidate = response.candidates?.[0];

    if (!candidate) throw new Error("API không phản hồi.");

    const base64Audio = candidate.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) return base64Audio;

    // Error handling
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
       if (candidate.finishReason === "SAFETY") throw new Error("Nội dung không an toàn.");
       if (candidate.finishReason === "RECITATION") throw new Error("Nội dung vi phạm bản quyền.");
       if (candidate.finishReason === "OTHER") throw new Error("Lỗi xử lý mô hình. Thử lại với đoạn văn ngắn hơn.");
    }
    
    const textResponse = candidate.content?.parts?.[0]?.text;
    if (textResponse) {
      console.warn("Text returned:", textResponse);
      throw new Error("Mô hình trả về văn bản thay vì âm thanh. Kiểm tra lại định dạng hội thoại.");
    }
    
    throw new Error("Không nhận được dữ liệu âm thanh.");

  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    const errorStr = JSON.stringify(error);
    if (errorStr.includes("AudioOut model") || error.message?.includes("non-audio response")) {
      throw new Error("Mô hình đang bận hoặc văn bản không hợp lệ.");
    }
    throw new Error(error.message || "Lỗi kết nối API.");
  }
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const base64ToBlobUrl = (base64: string): string => {
  try {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const subChunk2Size = bytes.length;
    const chunkSize = 36 + subChunk2Size;

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, chunkSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, subChunk2Size, true);

    const blob = new Blob([view, bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("WAV conversion error:", e);
    throw new Error("Lỗi xử lý file âm thanh.");
  }
};