import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import { AudioState, SupportedLanguage, TTSConfig, HistoryItem, VOICE_OPTIONS } from './types';
import { base64ToBlobUrl, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [text, setText] = useState<string>("");
  
  const [config, setConfig] = useState<TTSConfig>({
    mode: 'single',
    language: SupportedLanguage.VIETNAMESE,
    speed: 1.0,
    voiceName: 'Zephyr', // Default trendy voice
    speaker1: { name: 'Speaker 1', voice: 'Orus' },
    speaker2: { name: 'Speaker 2', voice: 'Aoede' }
  });
  
  const [audioState, setAudioState] = useState<AudioState>({
    blobUrl: null,
    isLoading: false,
    error: null
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const getVoiceLabel = (): string => {
    if (config.mode === 'single') {
      const v = VOICE_OPTIONS.find(v => v.id === config.voiceName);
      return v ? `${v.name} (${v.gender})` : config.voiceName;
    } else {
      const v1 = VOICE_OPTIONS.find(v => v.id === config.speaker1.voice);
      const v2 = VOICE_OPTIONS.find(v => v.id === config.speaker2.voice);
      const n1 = v1 ? v1.name : config.speaker1.voice;
      const n2 = v2 ? v2.name : config.speaker2.voice;
      return `${n1} & ${n2}`;
    }
  };

  const handleConvert = async () => {
    if (!text.trim()) return;

    setAudioState({
      blobUrl: null,
      isLoading: true,
      error: null
    });

    try {
      const base64Data = await generateSpeech(text, config);
      const blobUrl = base64ToBlobUrl(base64Data);
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text: text.length > 50 ? text.substring(0, 50) + '...' : text,
        mode: config.mode,
        blobUrl: blobUrl,
        voiceLabel: getVoiceLabel()
      };

      setHistory(prev => [newItem, ...prev]);

      setAudioState({
        blobUrl: blobUrl,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setAudioState({
        blobUrl: null,
        isLoading: false,
        error: error.message || "Đã có lỗi xảy ra."
      });
    }
  };

  const handlePlayHistory = (item: HistoryItem) => {
    setAudioState({
      blobUrl: item.blobUrl,
      isLoading: false,
      error: null
    });
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden selection:bg-secondary selection:text-white">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left Column: Input (7 cols) */}
            <div className="lg:col-span-7 h-full">
               <InputSection 
                text={text}
                setText={setText}
                config={config}
                setConfig={setConfig}
                onConvert={handleConvert}
                isLoading={audioState.isLoading}
              />
            </div>

            {/* Right Column: Result & History (5 cols) */}
            <div className="lg:col-span-5 h-full">
              <ResultSection 
                audioState={audioState}
                config={config}
                history={history}
                onPlayHistory={handlePlayHistory}
              />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default App;