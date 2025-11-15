import React, { useState, useEffect } from 'react';
import { XIcon, UserIcon, GithubIcon, LinkedinIcon, MailIcon, ClockIcon, CalendarIcon, DocumentIcon, MicrophoneIcon } from './Icons';

interface RightPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ isOpen, setIsOpen }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Overlay for mobile/tablet */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 xl:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      <aside
        className={`fixed xl:relative right-0 flex flex-col h-full bg-surface border-l border-border-color transition-transform duration-300 ease-in-out z-50 xl:z-auto overflow-y-auto ${
          isOpen ? 'w-80 sm:w-96 translate-x-0' : 'w-80 sm:w-96 translate-x-full xl:w-0'
        }`}
      >
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b border-border-color sticky top-0 bg-surface z-10 ${!isOpen && 'xl:hidden'}`}>
          <h2 className="text-base sm:text-lg font-semibold">Settings & Info</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" aria-label="Close details panel">
            <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className={`p-3 sm:p-4 space-y-4 sm:space-y-6 flex-1 ${!isOpen && 'xl:hidden'}`}>
          
          {/* Developer Info */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg ring-2 ring-cyan-accent/30">
                <img 
                  src="/akash-photo.jpg" 
                  alt="Akash S" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden w-16 h-16 rounded-full bg-gradient-to-br from-cyan-accent to-blue-500 items-center justify-center text-white font-bold text-xl">
                  AS
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold">Akash S</h3>
                <p className="text-xs text-muted">Creator & Developer</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                💡 Innovative AI Engineer & Full-Stack Developer with expertise in building intelligent systems and modern web applications.
              </p>
              
              <div className="pt-3 border-t border-border-color space-y-2">
                <h4 className="text-xs font-semibold text-muted">Connect with me:</h4>
                
                <a href="https://github.com/Akash-62" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <GithubIcon className="w-4 h-4 text-muted group-hover:text-cyan-accent" />
                  <span className="text-xs">GitHub</span>
                </a>
                
                <a href="https://www.linkedin.com/in/akash-s62/" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <LinkedinIcon className="w-4 h-4 text-muted group-hover:text-cyan-accent" />
                  <span className="text-xs">LinkedIn</span>
                </a>
                
                <a href="mailto:akashsofficial62@gmail.com" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-hover transition-colors group">
                  <MailIcon className="w-4 h-4 text-muted group-hover:text-cyan-accent" />
                  <span className="text-xs">Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* About Druva */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-xl p-4 border border-cyan-500/20">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-cyan-accent">✨</span> About Druva
            </h3>
            <div className="space-y-2 text-xs text-text-secondary leading-relaxed">
              <p>
                <strong className="text-cyan-accent">Druva</strong> is an advanced AI assistant created by <strong>Akash S</strong>, a talented and intelligent developer passionate about AI and innovation.
              </p>
              <p>
                Built with cutting-edge technology including React, TypeScript, and Groq AI, Druva combines warmth, intelligence, and efficiency to provide an exceptional conversational experience.
              </p>
              <p className="text-xs text-muted italic">
                "Intelligence with emotion, technology with heart" - Akash S
              </p>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-surface-hover rounded-lg p-3 border border-border-color">
            <h3 className="text-xs font-semibold text-muted mb-2">System Information</h3>
            <div className="space-y-1 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-mono text-cyan-accent">v1.2.0</span>
              </div>
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-mono">Llama 3.3 70B</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
{/* Date & Time Widget */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="w-5 h-5 text-cyan-accent" />
              <h3 className="text-sm font-semibold">Current Time (India)</h3>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-cyan-accent font-mono">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(currentTime)}
              </div>
              <div className="text-xs text-muted mt-2">
                🌏 IST (GMT+5:30)
              </div>
            </div>
          </div>  
          {/* Footer */}
          <div className="text-center pt-4 border-t border-border-color">
            <p className="text-xs text-muted">
              Made with ❤️ by <span className="text-cyan-accent font-semibold">Akash S</span>
            </p>
            <p className="text-xs text-muted mt-1">
              © 2025 Druva AI. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};