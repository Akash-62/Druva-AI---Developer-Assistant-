import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon, PaperclipIcon, MicrophoneIcon } from './Icons';

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onFileUpload?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading, onFileUpload }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Change to 'en-IN' for Indian English
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setText(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please enable microphone permissions.');
          } else if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.');
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-2 sm:px-0">
        <div className="relative flex items-center bg-surface rounded-2xl shadow-sm border border-border-color focus-within:ring-2 focus-within:ring-cyan-accent">
        <button 
          onClick={onFileUpload}
          className="p-2 sm:p-3 text-muted hover:text-cyan-accent flex-shrink-0 transition-colors" 
          aria-label="Attach file"
          type="button"
        >
          <PaperclipIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message Druva..."
            className="w-full max-h-48 resize-none bg-transparent focus:outline-none p-3 pr-20 sm:pr-24 text-sm sm:text-base text-text-primary"
            disabled={isLoading}
            aria-label="Chat input"
        />
        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
            <button 
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-muted hover:text-cyan-accent hover:bg-surface-hover'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isListening ? 'Stop listening' : 'Use voice input'}
              title={isListening ? 'Listening... Click to stop' : 'Click to speak'}
            >
                <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
                onClick={handleSend}
                disabled={isLoading || !text.trim()}
                className="p-1.5 sm:p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed enabled:bg-cyan-accent enabled:text-white"
                aria-label="Send message"
            >
                <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </div>
        </div>
    </div>
  );
};