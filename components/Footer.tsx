import React from 'react';
import { Github, Youtube, MessageCircle, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 text-center text-gray-400 text-sm">
      
      <p className="opacity-50">© {new Date().getFullYear()} Vinavoice <Heart className="w-4 h-4 text-secondary fill-secondary animate-pulse" /> test by Quang Huy</p>
    </footer>
  );
};

export default Footer;
