import React, { useEffect, useRef } from 'react';
import { AudioState, TTSConfig, HistoryItem } from '../types';
import { Download, AlertCircle, Radio, Clock, PlayCircle, Mic } from 'lucide-react';

interface ResultSectionProps {
  audioState: AudioState;
  config?: TTSConfig;
  history: HistoryItem[];
  onPlayHistory: (item: HistoryItem) => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ audioState, config, history, onPlayHistory }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && config) {
      audioRef.current.playbackRate = config.speed;
    }
  }, [config?.speed, audioState.blobUrl]);

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Main Player */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)]">
        {/* Animated Background Blob */}
        {audioState.blobUrl && !audioState.isLoading && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[60px] animate-pulse pointer-events-none"></div>
        )}

        {audioState.isLoading && (
          <div className="flex flex-col items-center z-10">
            <div className="relative w-20 h-20">
               <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
               <div className="absolute inset-0 rounded-full border-4 border-t-secondary animate-spin"></div>
            </div>
            <p className="mt-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-bold text-xl animate-pulse">
              AI Đang Đọc...
            </p>
          </div>
        )}

        {audioState.error && (
          <div className="text-red-400 bg-red-900/30 p-6 rounded-2xl border border-red-500/30 text-center z-10">
            <AlertCircle className="w-10 h-10 mx-auto mb-2" />
            <p className="font-semibold">{audioState.error}</p>
          </div>
        )}

        {!audioState.isLoading && !audioState.blobUrl && !audioState.error && (
          <div className="text-center z-10 opacity-50">
            <Radio className="w-16 h-16 mx-auto mb-4 text-white" />
            <p className="text-gray-300">Sẵn sàng chuyển đổi văn bản</p>
          </div>
        )}

        {audioState.blobUrl && !audioState.isLoading && (
          <div className="w-full flex flex-col items-center z-10 animate-fade-in-up">
            <div className="w-full bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-6">
              <audio 
                ref={audioRef}
                controls 
                className="w-full h-10 custom-audio" 
                src={audioState.blobUrl} 
                autoPlay
              >
                Trình duyệt của bạn không hỗ trợ thẻ audio.
              </audio>
            </div>

            <a 
              href={audioState.blobUrl} 
              download={`vinavoice-${Date.now()}.wav`}
              className="flex items-center gap-2 bg-white text-dark font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              <Download className="w-5 h-5" />
              Tải Xuống
            </a>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="glass-panel rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[200px]">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
           <Clock className="w-5 h-5 text-accent" />
           <h3 className="font-bold text-lg">Lịch Sử Phiên</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
           {history.length === 0 ? (
             <p className="text-center text-gray-500 text-sm mt-8">Chưa có lịch sử</p>
           ) : (
             <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors flex items-center justify-between group">
                     <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.mode === 'single' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                             {item.mode === 'single' ? 'Đơn Ca' : 'Hội Thoại'}
                           </span>
                           <span className="text-[10px] text-gray-400">
                             {new Date(item.timestamp).toLocaleTimeString()}
                           </span>
                           {item.voiceLabel && (
                             <span className="flex items-center text-[10px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded">
                               <Mic className="w-3 h-3 mr-1" /> {item.voiceLabel}
                             </span>
                           )}
                        </div>
                        <p className="text-sm text-gray-300 truncate font-medium">{item.text}</p>
                     </div>
                     <button 
                        onClick={() => onPlayHistory(item)}
                        className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all opacity-80 hover:opacity-100"
                     >
                        <PlayCircle className="w-5 h-5" />
                     </button>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

    </div>
  );
};

export default ResultSection;