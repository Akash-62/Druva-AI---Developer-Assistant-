import React, { useState, useEffect, useRef } from 'react';
import { Message as MessageType } from '../types';
import { ArcReactorLogo, ClipboardCopyIcon, CheckIcon, PencilIcon, RefreshIcon } from './Icons';

interface MessageProps {
  message: MessageType;
  isEditing: boolean;
  onSetEditing: () => void;
  onCancelEditing: () => void;
  onSaveEdit: (id: string, newContent: string) => void;
  onRegenerate: (id: string) => void;
  isOtherMessageEditing: boolean;
}

// Extend the Window interface to include the KaTeX auto-render function
declare global {
  interface Window {
    renderMathInElement: (element: HTMLElement, options?: any) => void;
  }
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-neutral-900 rounded-lg my-4 text-white font-mono overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-t-lg">
                <span className="font-semibold">{language || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-neutral-700 rounded transition-colors" aria-label="Copy code to clipboard">
                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardCopyIcon className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 text-sm overflow-auto scrollbar-hide">
                <code className="break-words whitespace-pre-wrap">{code}</code>
            </pre>
        </div>
    );
};


const renderContent = (content: string) => {
    if (!content && content !== '') return null;
    
    // Match code blocks with language tags: ```language\n...code...\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            parts.push(
                <span key={`text-${keyIndex++}`} className="whitespace-pre-wrap leading-relaxed">
                    {content.slice(lastIndex, match.index)}
                </span>
            );
        }
        
        // Add code block
        const language = match[1] || 'code';
        const code = match[2];
        parts.push(<CodeBlock key={`code-${keyIndex++}`} code={code} language={language} />);
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(
            <span key={`text-${keyIndex++}`} className="whitespace-pre-wrap leading-relaxed">
                {content.slice(lastIndex)}
            </span>
        );
    }
    
    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap leading-relaxed">{content}</span>;
};

export const Message: React.FC<MessageProps> = ({ message, isEditing, onSetEditing, onCancelEditing, onSaveEdit, onRegenerate, isOtherMessageEditing }) => {
  const isUser = message.role === 'user';
  const [editedContent, setEditedContent] = useState(message.content);
  const contentRef = useRef<HTMLDivElement>(null);
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });


  useEffect(() => {
    if (!isEditing) {
      setEditedContent(message.content);
    }
  }, [isEditing, message.content]);
  
  // Effect to render LaTeX
  useEffect(() => {
    if (contentRef.current && window.renderMathInElement) {
        try {
            window.renderMathInElement(contentRef.current, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false
            });
        } catch (error) {
            console.error("KaTeX rendering error:", error);
        }
    }
  }, [message.content, isEditing]);

  const handleSave = () => {
    onSaveEdit(message.id, editedContent);
  };
  
  if (isUser && isEditing) {
    return (
      <div className="flex items-start gap-2 sm:gap-4 max-w-4xl mx-auto flex-row-reverse px-2 sm:px-0">
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-cyan-accent text-white font-semibold text-xs">
          You
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 sm:p-4 text-sm sm:text-base border rounded-xl bg-surface border-border-color focus:outline-none focus:ring-2 focus:ring-cyan-accent text-text-primary"
            rows={Math.max(3, editedContent.split('\n').length)}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={onCancelEditing}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-md hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-cyan-accent rounded-md hover:opacity-90"
            >
              Save & Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-2 sm:gap-4 max-w-4xl mx-auto px-2 sm:px-0 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-cyan-accent text-white font-semibold text-xs' : 'bg-surface'}`}>
        {isUser ? 'You' : <ArcReactorLogo className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-accent" />}
      </div>
      <div 
        ref={contentRef}
        className={`p-3 sm:p-4 rounded-xl min-w-0 transition-transform duration-300 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1 ${isUser ? 'bg-cyan-accent text-white max-w-fit' : 'bg-surface text-text-secondary flex-1 max-w-[calc(100%-8rem)] sm:max-w-[75%]'}`}>
          {renderContent(message.content) || <>&nbsp;</>}
      </div>
      
      <div className="self-center flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isUser && !isEditing && !isOtherMessageEditing && (
          <div className="flex items-center">
            <button 
                onClick={() => onRegenerate(message.id)}
                className="p-1 rounded-full hover:bg-surface-hover"
                aria-label="Regenerate response"
            >
                <RefreshIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted" />
            </button>
            <button 
                onClick={onSetEditing}
                className="p-1 rounded-full hover:bg-surface-hover"
                aria-label="Edit message"
            >
                <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted" />
            </button>
          </div>
        )}
        <span className="hidden sm:inline text-xs text-muted ml-1 w-14 text-center">{formattedTime}</span>
      </div>
    </div>
  );
};