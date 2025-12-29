import React from 'react';
import { Github, Youtube, MessageCircle, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 text-center text-gray-400 text-sm">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-secondary fill-secondary animate-pulse" />
        <span>for Vietnam Creators</span>
      </div>
      <p className="opacity-50">© {new Date().getFullYear()} Vinavoice Gen Z. Powered by Google Gemini.</p>
    </footer>
  );
};

export default Footer;