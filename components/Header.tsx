import React, { useState, useEffect } from 'react';
import { MenuIcon, ArcReactorLogo, CogIcon, ShareIcon } from './Icons';
import { useTheme } from '../hooks/useDarkMode';
import { SunIcon, MoonIcon, SparklesIcon } from './Icons';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  toggleRightPanel: () => void;
  isRightPanelOpen: boolean;
  onShare?: () => void;
  hasMessages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  isSidebarOpen,
  toggleRightPanel,
  isRightPanelOpen,
  onShare,
  hasMessages = false
}) => {
  const [theme, cycleTheme] = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const chatArea = document.querySelector('.flex-1.overflow-y-auto');
      if (!chatArea) return;

      const currentScrollY = chatArea.scrollTop;

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    const chatArea = document.querySelector('.flex-1.overflow-y-auto');
    if (chatArea) {
      chatArea.addEventListener('scroll', handleScroll, { passive: true });
      return () => chatArea.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  const renderThemeIcon = () => {
    if (theme === 'light') return <MoonIcon className="w-6 h-6 text-muted" />;
    if (theme === 'dark') return <SparklesIcon className="w-6 h-6 text-muted" />;
    return <SunIcon className="w-6 h-6 text-muted" />;
  };

  return (
    <header
      className={`flex-shrink-0 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 border-b border-border-color sticky top-0 z-50 bg-bkg transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      style={{
        backdropFilter: 'blur(10px)',
        backgroundColor: 'var(--color-bkg)',
      }}
    >
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-full hover:bg-surface-hover transition-colors duration-200 flex-shrink-0 ${isSidebarOpen ? 'lg:hidden' : ''}`}
          aria-label="Toggle sidebar"
        >
          <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted" />
        </button>
        <div className="flex items-center space-x-2 min-w-0">
          <ArcReactorLogo className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-accent flex-shrink-0" />
          <span className="hidden xs:inline text-lg sm:text-xl font-bold text-text-primary truncate">Druva</span>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        {hasMessages && onShare && (
          <button
            onClick={onShare}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors duration-200"
            aria-label="Share conversation"
            title="Share conversation"
          >
            <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted hover:text-cyan-accent transition-colors" />
          </button>
        )}
        <button
          onClick={() => cycleTheme()}
          className="p-2 rounded-full hover:bg-surface-hover transition-colors duration-200"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'OLED' : 'light'} mode`}
        >
          {renderThemeIcon()}
        </button>
        <button
          onClick={toggleRightPanel}
          className="p-2 rounded-full hover:bg-surface-hover transition-colors duration-200"
          aria-label="Toggle settings panel"
        >
          <CogIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted" />
        </button>
      </div>
    </header>
  );
};