import React from 'react';
import { AudioLines } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 flex flex-col items-center justify-center mb-4">
      <div className="inline-flex items-center gap-3 mb-2">
        <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-lg shadow-primary/30">
           <AudioLines className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          VINAVOICE <span className="text-primary">GEN Z</span>
        </h1>
      </div>
      <p className="text-gray-400 font-medium tracking-wide text-sm uppercase">
        Create • Listen • Vibe
      </p>
    </header>
  );
};

export default Header;