import React, { useEffect, useRef, useState } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { InputBar } from './InputBar';
import { ArcReactorLogo, DocumentIcon, XIcon } from './Icons';

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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File, content: string, status: 'processing' | 'ready' | 'error' }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from file
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result;

          if (!content) {
            reject(new Error('Failed to read file content'));
            return;
          }

          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            // Handle text files
            resolve(content as string);
          } else if (file.type.startsWith('image/')) {
            // Handle images/screenshots
            resolve(`[Image/Screenshot: ${file.name}]\n\nFile Information:\n- Size: ${(file.size / 1024).toFixed(2)} KB\n- Type: ${file.type}\n- Dimensions: Loading...\n\nNote: This is an image file. I can see it's been uploaded. Please describe what you'd like me to analyze about this image, or ask questions about it!\n\n💡 You can ask me to:\n- Describe what's in the image\n- Extract text from the screenshot\n- Analyze the content\n- Answer questions about what you see`);
          } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // For PDF files
            resolve(`[PDF Document: ${file.name}]\n\nFile Information:\n- Size: ${(file.size / 1024).toFixed(2)} KB\n- Type: PDF\n\nNote: This is a PDF file. The AI can discuss the document based on your description. For full text extraction, PDF parsing libraries are needed on the backend.\n\nYou can describe what's in the PDF, and I'll help you analyze it!`);
          } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
            // For Word documents
            resolve(`[Word Document: ${file.name}]\n\nFile Information:\n- Size: ${(file.size / 1024).toFixed(2)} KB\n- Type: Microsoft Word\n\nNote: This is a Word document. The AI can discuss the document based on your description. For full text extraction, document parsing is needed.\n\nYou can describe the content, and I'll help you work with it!`);
          } else if (file.type.startsWith('text/')) {
            // Handle other text-based files
            resolve(content as string);
          } else {
            resolve(`[File: ${file.name}]\n\nFile Information:\n- Size: ${(file.size / 1024).toFixed(2)} KB\n- Type: ${file.type || 'Unknown'}\n\nNote: This file type may require specific parsing. Please describe what you'd like to do with this file.`);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      // Use readAsText for text files, readAsDataURL for others
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        // For non-text files, we'll create a description
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle date/time queries and document context
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

    // Add document context if files are uploaded
    if (uploadedFiles.length > 0) {
      const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
      if (readyFiles.length > 0) {
        message += '\n\n--- Uploaded Documents Context ---\n';
        readyFiles.forEach((fileData, index) => {
          message += `\n[Document ${index + 1}: ${fileData.file.name}]\n${fileData.content}\n`;
        });
        message += '\n--- End of Documents ---\n\nPlease analyze the above documents and respond to my question.';
      }
    }

    onSendMessage(message);

    // Clear uploaded files after sending
    if (uploadedFiles.length > 0) {
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];

    for (const file of Array.from(files)) {
      if (validTypes.includes(file.type) || file.name.endsWith('.txt')) {
        // Add file with processing status
        setUploadedFiles(prev => [...prev, { file, content: '', status: 'processing' }]);

        try {
          const content = await extractTextFromFile(file);
          setUploadedFiles(prev =>
            prev.map(item =>
              item.file === file
                ? { ...item, content, status: 'ready' as const }
                : item
            )
          );
        } catch (error) {
          console.error('Error processing file:', error);
          setUploadedFiles(prev =>
            prev.map(item =>
              item.file === file
                ? { ...item, status: 'error' as const }
                : item
            )
          );
        }
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
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
    <div
      className="flex flex-col h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-cyan-accent/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface p-8 rounded-2xl border-2 border-dashed border-cyan-accent shadow-2xl">
            <DocumentIcon className="w-16 h-16 text-cyan-accent mx-auto mb-4" />
            <p className="text-xl font-bold text-cyan-accent">Drop files here</p>
            <p className="text-sm text-muted mt-2">PDF, TXT, DOC, DOCX, Images supported</p>
          </div>
        </div>
      )}

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
        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <DocumentIcon className="w-4 h-4 text-cyan-accent" />
              <span className="text-xs font-semibold text-muted">Attached Documents ({uploadedFiles.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((fileData, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${fileData.status === 'ready' ? 'bg-green-500/10 border-green-500/30' :
                    fileData.status === 'processing' ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse' :
                      'bg-red-500/10 border-red-500/30'
                    }`}
                >
                  <DocumentIcon className={`w-4 h-4 ${fileData.status === 'ready' ? 'text-green-500' :
                    fileData.status === 'processing' ? 'text-cyan-accent' :
                      'text-red-500'
                    }`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate max-w-[150px]">{fileData.file.name}</span>
                    <span className="text-[10px] text-muted">
                      {fileData.status === 'ready' && `✓ Ready • ${(fileData.file.size / 1024).toFixed(1)} KB`}
                      {fileData.status === 'processing' && '⏳ Processing...'}
                      {fileData.status === 'error' && '✗ Error'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-surface-hover rounded transition-colors"
                    aria-label="Remove file"
                  >
                    <XIcon className="w-3 h-3 text-muted" />
                  </button>
                </div>
              ))}
            </div>
            {uploadedFiles.some(f => f.status === 'ready') && (
              <p className="text-xs text-cyan-accent mt-2 flex items-center gap-1">
                <span>💡</span>
                <span>Documents will be analyzed with your next message</span>
              </p>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <InputBar
          onSendMessage={handleSendWithTimeCheck}
          isLoading={isLoading || editingMessageId !== null}
          onFileUpload={() => fileInputRef.current?.click()}
          onStopGenerating={onStopGenerating}
        />
        <p className="text-center text-xs text-muted mt-2 px-2">
          Druva can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};