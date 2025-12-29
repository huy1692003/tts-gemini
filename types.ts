export type TTSMode = 'single' | 'conversation';

export interface TTSConfig {
  mode: TTSMode;
  voiceName: string; // Used for single mode
  speaker1: { name: string; voice: string }; // Used for conversation
  speaker2: { name: string; voice: string }; // Used for conversation
  speed: number;
  language: string;
}

export enum SupportedLanguage {
  VIETNAMESE = 'vi',
  ENGLISH = 'en'
}

export interface AudioState {
  blobUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  text: string;
  mode: TTSMode;
  blobUrl: string;
  voiceLabel: string; // New field to store used voice names
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string; // New field
  desc: string;
}

// Full Voice List provided by user with inferred genders
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Zephyr', name: 'Zephyr', gender: 'Nữ', desc: 'Tươi sáng' },
  { id: 'Puck', name: 'Puck', gender: 'Nam', desc: 'Rộn ràng' },
  { id: 'Charon', name: 'Charon', gender: 'Nam', desc: 'Nhiều thông tin' },
  { id: 'Kore', name: 'Kore', gender: 'Nữ', desc: 'Firm' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Nam', desc: 'Dễ kích động' },
  { id: 'Leda', name: 'Leda', gender: 'Nữ', desc: 'Trẻ trung' },
  { id: 'Orus', name: 'Orus', gender: 'Nam', desc: 'Firm' },
  { id: 'Aoede', name: 'Aoede', gender: 'Nữ', desc: 'Breezy (Vui vẻ)' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Nữ', desc: 'Dễ chịu' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'Nữ', desc: 'Tươi sáng' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'Nữ', desc: 'Breathy' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'Nam', desc: 'Rõ ràng' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'Nữ', desc: 'Dễ tính' },
  { id: 'Algieba', name: 'Algieba', gender: 'Nữ', desc: 'Làm mịn' },
  { id: 'Despina', name: 'Despina', gender: 'Nữ', desc: 'Mượt mà' },
  { id: 'Erinome', name: 'Erinome', gender: 'Nữ', desc: 'Clear' },
  { id: 'Algenib', name: 'Algenib', gender: 'Nam', desc: 'Khàn' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Nam', desc: 'Nhiều thông tin' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Nữ', desc: 'Rộn ràng' },
  { id: 'Achernar', name: 'Achernar', gender: 'Nữ', desc: 'Mềm' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'Nam', desc: 'Firm' },
  { id: 'Schedar', name: 'Schedar', gender: 'Nữ', desc: 'Even' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Nam', desc: 'Người trưởng thành' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Nữ', desc: 'Lạc quan' },
  { id: 'Achird', name: 'Achird', gender: 'Nam', desc: 'Thân thiện' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Nữ', desc: 'Thông thường' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Nữ', desc: 'Êm dịu' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Nữ', desc: 'Lively (Sống động)' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Nam', desc: 'Hiểu biết' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Nam', desc: 'Ấm áp' },
];