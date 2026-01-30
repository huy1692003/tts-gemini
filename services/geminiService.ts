import { GoogleGenAI, Modality } from "@google/genai";
import { TTSConfig, SupportedLanguage } from "../types";

// Parse API keys from environment variable
const getApiKeys = (): string[] => {
  const apiKeysString = process.env.API_KEYS || "";
  const keys = apiKeysString
    .split(";")
    .map(key => key.trim())
    .filter(key => key.length > 0);
  
  console.log(`[API Keys] Tổng số keys: ${keys.length}`);
  return keys;
};

// Get random API key from the list
const getRandomApiKey = (): string => {
  const apiKeys = getApiKeys();
  
  if (apiKeys.length === 0) {
    console.error("[API Keys] Không tìm thấy API key trong biến môi trường API_KEYS");
    throw new Error("Không tìm thấy API key. Vui lòng cấu hình API_KEYS trong file .env");
  }
  
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  const selectedKey = apiKeys[randomIndex];
  console.log(`[API Keys] Chọn key #${randomIndex + 1} (${selectedKey.substring(0, 10)}...)`);
  return selectedKey;
};

// Retry logic with different API keys
const executeWithRetry = async <T>(
  operation: (apiKey: string) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  const apiKeys = getApiKeys();
  const usedKeys = new Set<string>();
  const errorDetails: Array<{keyIndex: number, error: any}> = [];
  let lastError: any;

  console.log(`[Retry] Bắt đầu với tối đa ${maxRetries} lần thử`);

  for (let attempt = 0; attempt < maxRetries && usedKeys.size < apiKeys.length; attempt++) {
    try {
      // Get a random key that hasn't been used yet
      let apiKey: string;
      let keyIndex: number;
      do {
        apiKey = getRandomApiKey();
        keyIndex = apiKeys.indexOf(apiKey);
      } while (usedKeys.has(apiKey) && usedKeys.size < apiKeys.length);
      
      usedKeys.add(apiKey);
      console.log(`[Retry] Lần thử ${attempt + 1}/${maxRetries} - Sử dụng key #${keyIndex + 1}: ${apiKey.substring(0, 10)}...`);
      
      const result = await operation(apiKey);
      console.log(`[Retry] ✓ Thành công ở lần thử ${attempt + 1}`);
      return result;
    } catch (error: any) {
      lastError = error;
      const keyIndex = apiKeys.indexOf(Array.from(usedKeys)[usedKeys.size - 1]);
      
      errorDetails.push({
        keyIndex: keyIndex + 1,
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
          type: error.constructor.name,
          details: error
        }
      });
      
      console.error(`[Retry] ✗ Lỗi ở lần thử ${attempt + 1} (Key #${keyIndex + 1}):`, {
        message: error.message,
        code: error.code,
        status: error.status,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // If it's a 429 error, try with another key
      const errorStr = JSON.stringify(error);
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        console.warn(`[Retry] API key #${keyIndex + 1} bị giới hạn (429/RESOURCE_EXHAUSTED), thử key khác...`);
        continue;
      }
      
      // For other errors, throw immediately
      console.error(`[Retry] Lỗi không phải 429, dừng retry`);
      throw error;
    }
  }
  
  // All retries failed - create detailed error message
  console.error(`[Retry] ===== TẤT CẢ API KEYS THẤT BẠI =====`);
  console.error(`[Retry] Đã thử ${errorDetails.length} keys:`);
  
  let detailedErrorMessage = `Tất cả ${errorDetails.length} API keys đều thất bại:\n\n`;
  
  errorDetails.forEach((detail, index) => {
    const errorMsg = detail.error.message || 'Không có thông báo lỗi';
    const errorCode = detail.error.code || detail.error.status || 'N/A';
    
    detailedErrorMessage += `Key #${detail.keyIndex}: ${errorMsg} (Code: ${errorCode})\n`;
    
    console.error(`[Retry] Key #${detail.keyIndex}:`, {
      message: errorMsg,
      code: errorCode,
      fullError: detail.error
    });
  });
  
  detailedErrorMessage += `\nVui lòng kiểm tra logs để biết chi tiết.`;
  
  console.error(`[Retry] ===== CHI TIẾT ĐẦY ĐỦ =====`);
  console.error(`[Retry] All error details:`, JSON.stringify(errorDetails, null, 2));
  console.error(`[Retry] Last error object:`, lastError);
  
  throw new Error(detailedErrorMessage);
};

export const generateSpeech = async (
  text: string,
  config: TTSConfig
): Promise<string> => {
  console.log(`[generateSpeech] Bắt đầu tạo speech`, {
    textLength: text.length,
    mode: config.mode,
    voiceName: config.mode === 'single' ? config.voiceName : undefined,
    speakers: config.mode === 'conversation' ? {
      speaker1: config.speaker1,
      speaker2: config.speaker2
    } : undefined
  });

  // 1. Aggressive Sanitization
  let cleanText = text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  console.log(`[generateSpeech] Sau khi sanitize: ${cleanText.length} ký tự`);

  if (!cleanText) {
    console.error("[generateSpeech] Văn bản rỗng sau khi sanitize");
    throw new Error("Vui lòng nhập văn bản.");
  }

  if (cleanText.length > 4000) {
    console.error(`[generateSpeech] Văn bản quá dài: ${cleanText.length} ký tự`);
    throw new Error(`Văn bản quá dài (${cleanText.length} ký tự). Vui lòng cắt nhỏ dưới 4000 ký tự.`);
  }

  return executeWithRetry(async (apiKey) => {
    try {
      // Initialize Gemini API with the selected key
      console.log(`[Gemini API] Khởi tạo với key: ${apiKey.substring(0, 10)}...`);
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-2.5-flash-preview-tts";
      
      // Config setup
      let speechConfig: any = {};
      let textToProcess = cleanText;

      if (config.mode === 'conversation') {
        // Multi-speaker config
        const prompt = `TTS the following conversation between ${config.speaker1.name} and ${config.speaker2.name}:\n\n${cleanText}`;
        textToProcess = prompt;
        console.log(`[Gemini API] Conversation mode - Prompt length: ${textToProcess.length}`);

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
        console.log(`[Gemini API] Speech config:`, JSON.stringify(speechConfig, null, 2));
      } else {
        // Single speaker
        speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.voiceName || 'Puck' },
          },
        };
        console.log(`[Gemini API] Single speaker mode - Voice: ${config.voiceName || 'Puck'}`);
      }

      console.log(`[Gemini API] Gửi request đến model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: textToProcess }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: speechConfig,
        },
      });

      console.log(`[Gemini API] Response nhận được:`, {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length,
        fullResponse: JSON.stringify(response, null, 2)
      });

      const candidate = response.candidates?.[0];

      if (!candidate) {
        console.error("[Gemini API] Không có candidate trong response");
        console.error("[Gemini API] Full response:", JSON.stringify(response, null, 2));
        throw new Error("API không phản hồi.");
      }

      console.log(`[Gemini API] Candidate details:`, {
        finishReason: candidate.finishReason,
        hasContent: !!candidate.content,
        hasParts: !!candidate.content?.parts,
        partsLength: candidate.content?.parts?.length,
        firstPartType: candidate.content?.parts?.[0] ? Object.keys(candidate.content.parts[0]) : undefined
      });

      const base64Audio = candidate.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        console.log(`[Gemini API] ✓ Nhận được audio base64, length: ${base64Audio.length}`);
        return base64Audio;
      }

      // Error handling
      if (candidate.finishReason && candidate.finishReason !== "STOP") {
         console.error(`[Gemini API] Finish reason không phải STOP: ${candidate.finishReason}`);
         console.error(`[Gemini API] Full candidate:`, JSON.stringify(candidate, null, 2));
         if (candidate.finishReason === "SAFETY") throw new Error("Nội dung không an toàn.");
         if (candidate.finishReason === "RECITATION") throw new Error("Nội dung vi phạm bản quyền.");
         if (candidate.finishReason === "OTHER") throw new Error("Lỗi xử lý mô hình. Thử lại với đoạn văn ngắn hơn.");
      }
      
      const textResponse = candidate.content?.parts?.[0]?.text;
      if (textResponse) {
        console.warn("[Gemini API] Model trả về text thay vì audio:", textResponse);
        console.error("[Gemini API] Full candidate:", JSON.stringify(candidate, null, 2));
        throw new Error("Mô hình trả về văn bản thay vì âm thanh. Kiểm tra lại định dạng hội thoại.");
      }
      
      console.error("[Gemini API] Không tìm thấy dữ liệu audio trong response");
      console.error("[Gemini API] Full response:", JSON.stringify(response, null, 2));
      throw new Error("Không nhận được dữ liệu âm thanh.");

    } catch (error: any) {
      console.error("[Gemini TTS Error] ===== CHI TIẾT LỖI =====");
      console.error("[Gemini TTS Error] Message:", error.message);
      console.error("[Gemini TTS Error] Name:", error.name);
      console.error("[Gemini TTS Error] Code:", error.code);
      console.error("[Gemini TTS Error] Status:", error.status);
      console.error("[Gemini TTS Error] Stack:", error.stack);
      console.error("[Gemini TTS Error] Full error object:", error);
      console.error("[Gemini TTS Error] JSON stringify:", JSON.stringify(error, null, 2));
      
      // Log thêm các properties có thể có
      if (error.response) {
        console.error("[Gemini TTS Error] Response data:", error.response);
      }
      if (error.error) {
        console.error("[Gemini TTS Error] Error field:", error.error);
      }
      
      const errorStr = JSON.stringify(error);
      
      // Re-throw 429 errors to trigger retry
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || error.code === 429) {
        console.warn("[Gemini TTS Error] Lỗi 429/RESOURCE_EXHAUSTED - sẽ retry");
        throw error;
      }
      
      if (errorStr.includes("AudioOut model") || error.message?.includes("non-audio response")) {
        console.error("[Gemini TTS Error] Lỗi AudioOut model hoặc non-audio response");
        throw new Error("Mô hình đang bận hoặc văn bản không hợp lệ.");
      }
      
      throw new Error(error.message || "Lỗi kết nối API.");
    }
  });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const base64ToBlobUrl = (base64: string): string => {
  try {
    console.log(`[base64ToBlobUrl] Chuyển đổi base64 (length: ${base64.length}) sang WAV`);
    
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[base64ToBlobUrl] Binary data length: ${len} bytes`);

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
    const url = URL.createObjectURL(blob);
    
    console.log(`[base64ToBlobUrl] ✓ Tạo blob URL thành công: ${url}`);
    return url;
  } catch (e) {
    console.error("[base64ToBlobUrl] Lỗi chuyển đổi WAV:", {
      error: e,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined
    });
    throw new Error("Lỗi xử lý file âm thanh.");
  }
};
