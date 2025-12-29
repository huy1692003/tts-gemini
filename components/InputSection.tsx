import React, { useState } from 'react';
import { SupportedLanguage, TTSConfig, VOICE_OPTIONS } from '../types';
import { Sparkles, PlayCircle, Loader2, Mic, Users, User, MessageSquare } from 'lucide-react';
import { generateSpeech, base64ToBlobUrl } from '../services/geminiService';

interface InputSectionProps {
  text: string;
  setText: (text: string) => void;
  config: TTSConfig;
  setConfig: (config: TTSConfig) => void;
  onConvert: () => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  text, 
  setText, 
  config, 
  setConfig, 
  onConvert,
  isLoading 
}) => {
  const [playingSample, setPlayingSample] = useState<string | null>(null);

  const playSample = async (voiceId: string) => {
    if (playingSample) return;
    setPlayingSample(voiceId);

    try {
      const sampleText = config.language === SupportedLanguage.VIETNAMESE 
        ? "Xin chào, đây là giọng mẫu của tôi." 
        : "Hello my is sample audio.";
      
      // Force single mode for sample
      const sampleConfig = { ...config, mode: 'single' as const, voiceName: voiceId };
      const base64 = await generateSpeech(sampleText, sampleConfig);
      const url = base64ToBlobUrl(base64);
      const audio = new Audio(url);
      
      audio.onended = () => setPlayingSample(null);
      audio.onerror = () => setPlayingSample(null);
      await audio.play();
    } catch (e) {
      setPlayingSample(null);
    }
  };

  const VoiceSelector = ({ 
    selected, 
    onSelect,
    label 
  }: { 
    selected: string, 
    onSelect: (id: string) => void,
    label?: string 
  }) => (
    <div className="flex flex-col gap-2">
      {label && <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {VOICE_OPTIONS.map((voice) => (
          <div 
            key={voice.id}
            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
              selected === voice.id 
                ? 'bg-gradient-to-r from-primary/30 to-secondary/30 border-secondary shadow-lg' 
                : 'bg-white/5 border-transparent hover:bg-white/10'
            }`}
            onClick={() => onSelect(voice.id)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                 selected === voice.id ? 'bg-secondary text-white' : 'bg-gray-700'
               }`}>
                 {voice.name.charAt(0)}
               </div>
               <div className="flex flex-col min-w-0">
                 <div className="flex items-baseline gap-1">
                   <span className={`text-sm font-bold truncate ${selected === voice.id ? 'text-white' : 'text-gray-300'}`}>
                     {voice.name}
                   </span>
                   <span className="text-[10px] text-gray-400 font-normal">({voice.gender})</span>
                 </div>
                 <span className="text-[10px] text-gray-500 truncate">{voice.desc}</span>
               </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSample(voice.id);
              }}
              disabled={!!playingSample}
              className={`p-1 rounded-full ${selected === voice.id ? 'text-secondary' : 'text-gray-500'}`}
            >
              {playingSample === voice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-full shadow-[0_0_40px_rgba(139,92,246,0.15)]">
      
      {/* Mode Switcher Tabs */}
      <div className="flex bg-black/20 p-1 rounded-2xl mb-6">
        <button 
          onClick={() => setConfig({...config, mode: 'single'})}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            config.mode === 'single' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Đơn Ca
        </button>
        <button 
          onClick={() => setConfig({...config, mode: 'conversation'})}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
            config.mode === 'conversation' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Hội Thoại
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* Config Area */}
        {config.mode === 'single' ? (
          <VoiceSelector 
            label="Chọn Giọng Đọc"
            selected={config.voiceName} 
            onSelect={(id) => setConfig({ ...config, voiceName: id })} 
          />
        ) : (
          <div className="space-y-4 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                   <div className="mb-2">
                     <label className="text-xs text-primary font-bold">VOICE 1</label>
                     <input 
                        type="text" 
                        value={config.speaker1.name}
                        onChange={(e) => setConfig({...config, speaker1: {...config.speaker1, name: e.target.value}})}
                        className="w-full bg-transparent border-b border-white/20 py-1 focus:border-primary outline-none text-sm font-semibold"
                        placeholder="Tên (VD: Huy)"
                     />
                   </div>
                   <VoiceSelector 
                      selected={config.speaker1.voice} 
                      onSelect={(id) => setConfig({ ...config, speaker1: {...config.speaker1, voice: id} })} 
                   />
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                   <div className="mb-2">
                     <label className="text-xs text-secondary font-bold">VOICE 2</label>
                     <input 
                        type="text" 
                        value={config.speaker2.name}
                        onChange={(e) => setConfig({...config, speaker2: {...config.speaker2, name: e.target.value}})}
                        className="w-full bg-transparent border-b border-white/20 py-1 focus:border-secondary outline-none text-sm font-semibold"
                        placeholder="Tên (VD: Lan)"
                     />
                   </div>
                   <VoiceSelector 
                      selected={config.speaker2.voice} 
                      onSelect={(id) => setConfig({ ...config, speaker2: {...config.speaker2, voice: id} })} 
                   />
                </div>
             </div>
          </div>
        )}

        {/* Text Input */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Kịch bản
            </label>
            <span className="text-[10px] text-gray-500 bg-white/10 px-2 py-1 rounded-full">
              {config.mode === 'conversation' ? `Format: ${config.speaker1.name}: Nội dung...` : 'Plain text'}
            </span>
          </div>
          <textarea 
            className="flex-1 w-full bg-black/20 text-white placeholder-gray-500 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-medium text-base min-h-[150px] border border-white/5"
            placeholder={
              config.mode === 'conversation' 
              ? `${config.speaker1.name}: Xin chào!\n${config.speaker2.name}: Chào cậu, khỏe không?\n${config.speaker1.name}: Mình khỏe, cảm ơn.` 
              : "Nhập nội dung vào đây..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <button 
          onClick={onConvert}
          disabled={isLoading || !text.trim()}
          className={`
            w-full font-bold text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider relative overflow-hidden group
            ${isLoading || !text.trim() 
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary via-purple-500 to-secondary hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]'
            }
          `}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
          )}
          {isLoading ? 'Đang Xử Lý...' : 'Tạo Âm Thanh'}
        </button>
      </div>
    </div>
  );
};

export default InputSection;