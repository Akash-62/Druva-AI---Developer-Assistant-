import React, { useEffect, useRef, useState } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { InputBar } from './InputBar';
import { ArcReactorLogo } from './Icons';

interface ChatAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  editingMessageId: string | null;
  onSetEditingMessageId: (id: string | null) => void;
  onSaveEdit: (id: string, newContent: string) => void;
  onRegenerate: (id: string) => void;
  onStopGenerating: () => void;
}

const WelcomeScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <ArcReactorLogo className="w-24 h-24 text-cyan-accent mb-4" />
    <h1 className="text-3xl font-bold text-text-primary">Druva</h1>
    <p className="mt-2 text-lg text-muted">How can I help you today?</p>
  </div>
);

const ThinkingIndicator: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-4 animate-fadeIn">
    <div className="relative flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-cyan-accent/30 border-t-cyan-accent rounded-full animate-spin"></div>
      <div className="absolute inset-0 bg-cyan-accent/10 blur-sm rounded-full"></div>
    </div>
    <span className="text-sm font-medium text-text-secondary animate-pulse">Just a sec...</span>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 sm:gap-4 w-full max-w-3xl mx-auto px-4 py-3 animate-fadeIn">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-surface border border-border-color">
      <ArcReactorLogo className="w-5 h-5 text-cyan-accent animate-spin-slow" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 bg-muted rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-muted rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-muted rounded-full animate-bounce"></span>
      </div>
    </div>
  </div>
);


export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSendMessage,
  editingMessageId,
  onSetEditingMessageId,
  onSaveEdit,
  onRegenerate,
  onStopGenerating
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle date/time queries
  const handleSendWithTimeCheck = (text: string) => {
    const lowerText = text.toLowerCase();
    const timeKeywords = ['time', 'clock', 'what time', "what's the time"];
    const dateKeywords = ['date', 'today', 'what day', 'what date', 'calendar'];

    const isTimeQuery = timeKeywords.some(keyword => lowerText.includes(keyword));
    const isDateQuery = dateKeywords.some(keyword => lowerText.includes(keyword));

    let message = text;

    // Add date/time context
    if (isTimeQuery || isDateQuery) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const date = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (isTimeQuery && isDateQuery) {
        message += `\n\n[Current Date & Time: ${date}, ${time} IST (GMT+5:30)]`;
      } else if (isTimeQuery) {
        message += `\n\n[Current Time: ${time} IST (GMT+5:30)]`;
      } else if (isDateQuery) {
        message += `\n\n[Current Date: ${date}]`;
      }
    }

    onSendMessage(message);
  };

  // Handle scroll to show/hide button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowScrollTop(scrollRef.current.scrollTop > 300);
      }
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isThinking]);

  // Show thinking indicator before response starts
  useEffect(() => {
    if (isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user') {
      setIsThinking(true);
      const timer = setTimeout(() => setIsThinking(false), 800);
      return () => clearTimeout(timer);
    } else {
      setIsThinking(false);
    }
  }, [isLoading, messages]);

  const renderMessages = () => (
    <>
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          isEditing={editingMessageId === msg.id}
          onSetEditing={onSetEditingMessageId}
          onSaveEdit={onSaveEdit}
          onRegenerate={onRegenerate}
          isOtherMessageEditing={editingMessageId !== null && editingMessageId !== msg.id}
        />
      ))}
      {isThinking && <ThinkingIndicator />}
      {isLoading && !isThinking && (!messages.length || messages[messages.length - 1].role === 'user') && (
        <TypingIndicator />
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain relative"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="py-4 space-y-2">
          {messages.length === 0 && !isLoading ? <WelcomeScreen /> : renderMessages()}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-24 right-6 p-2 bg-surface border border-border-color rounded-full shadow-lg hover:bg-surface-hover transition-all duration-300 z-20 animate-fadeIn"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      <div
        className="px-3 py-3 sm:p-4 border-t border-border-color bg-bkg safe-area-bottom"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <InputBar
          onSendMessage={handleSendWithTimeCheck}
          isLoading={isLoading || editingMessageId !== null}
          onStopGenerating={onStopGenerating}
        />
        <p className="text-center text-xs text-muted mt-2 px-2">
          Druva can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};