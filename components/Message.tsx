import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message as MessageType } from '../types';
import { ArcReactorLogo, ClipboardCopyIcon, CheckIcon, PencilIcon, RefreshIcon } from './Icons';

interface MessageProps {
  message: MessageType;
  isEditing: boolean;
  onSetEditing: (id: string | null) => void;
  onSaveEdit: (id: string, newContent: string) => void;
  onRegenerate: (id: string) => void;
  isOtherMessageEditing: boolean;
}

// CodeBlock component
const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  // Get current theme from document
  const isDark = document.documentElement.classList.contains('dark') ||
    document.documentElement.classList.contains('oled');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-surface-hover text-cyan-accent font-mono text-sm" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border-color bg-surface">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-hover border-b border-border-color">
        <span className="text-xs font-semibold text-muted">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-surface rounded transition-colors text-text-primary"
          aria-label="Copy code to clipboard"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardCopyIcon className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div
        className="overflow-x-auto w-full"
        style={{
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch',
          display: 'block'
        }}
      >
        <SyntaxHighlighter
          language={language || 'text'}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: isDark ? '#1e1e1e' : '#fafafa',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            whiteSpace: 'pre',     // Crucial for scrolling
            overflowX: 'auto',     // Crucial for scrolling
            wordBreak: 'normal',   // Crucial for scrolling
            overflowWrap: 'normal' // Crucial for scrolling
          }}
          showLineNumbers={true}
          wrapLines={false}        // Crucial for scrolling
          wrapLongLines={false}    // Crucial for scrolling
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const Message: React.FC<MessageProps> = React.memo(({
  message,
  isEditing,
  onSetEditing,
  onSaveEdit,
  onRegenerate,
  isOtherMessageEditing
}) => {
  const isUser = message.role === 'user';
  const [editedContent, setEditedContent] = useState(message.content);
  const contentRef = useRef<HTMLDivElement>(null);
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });

  useEffect(() => {
    if (!isEditing) {
      setEditedContent(message.content);
    }
  }, [isEditing, message.content]);

  const handleSave = () => {
    onSaveEdit(message.id, editedContent);
  };

  const handleCancel = () => {
    onSetEditing(null);
  };

  const handleEditStart = () => {
    onSetEditing(message.id);
  };

  // Parse content for thought tags
  const thoughtMatch = message.content.match(/<thought>([\s\S]*?)<\/thought>/);
  const thoughtContent = thoughtMatch ? thoughtMatch[1].trim() : null;
  const cleanContent = message.content.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();

  const [isCopied, setIsCopied] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(cleanContent || message.content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (isUser && isEditing) {
    return (
      <div className="flex items-start gap-3 sm:gap-4 w-full max-w-3xl mx-auto px-4 py-3 flex-row-reverse">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-cyan-accent text-white font-semibold text-xs">
          You
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 sm:p-4 text-sm sm:text-base border rounded-xl bg-surface border-border-color focus:outline-none focus:ring-2 focus:ring-cyan-accent text-text-primary resize-none"
            rows={Math.max(3, editedContent.split('\n').length)}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-accent rounded-lg hover:opacity-90 transition-opacity"
            >
              Save & Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex gap-4 w-full sm:max-w-3xl mx-auto px-4 py-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-cyan-accent flex items-center justify-center text-white text-sm font-semibold">
            You
          </div>
        ) : (
          <ArcReactorLogo className="w-8 h-8 text-cyan-accent" />
        )}
      </div>

      {/* Message Content Container */}
      <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>

        {/* Thinking Process UI */}
        {!isUser && thoughtContent && (
          <div className="w-full mb-3 max-w-2xl">
            <button
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="flex items-center gap-2 text-xs font-medium text-muted hover:text-cyan-accent transition-colors mb-2 select-none"
            >
              <span className="text-lg">💭</span>
              <span>Thinking Process</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isThinkingOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isThinkingOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-3 bg-surface/50 border border-border-color rounded-lg text-sm text-text-secondary italic leading-relaxed whitespace-pre-wrap">
                {thoughtContent}
              </div>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div
          ref={contentRef}
          className={`prose prose-sm sm:prose-base ${isUser
            ? 'bg-cyan-accent text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-md'
            : 'text-text-primary max-w-none'
            }`}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: CodeBlock as any,
                p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-cyan-accent pl-4 italic my-4 text-text-secondary">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-accent hover:underline">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-border-color">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border-color px-4 py-2 bg-surface font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border-color px-4 py-2">{children}</td>
                ),
              }}
            >
              {cleanContent || (thoughtContent ? 'Thinking complete.' : message.content)}
            </ReactMarkdown>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Copy Button */}
          <button
            onClick={handleCopyMessage}
            className="p-1.5 rounded-md hover:bg-surface-hover transition-colors"
            aria-label="Copy message"
            title="Copy"
          >
            {isCopied ? (
              <CheckIcon className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ClipboardCopyIcon className="w-3.5 h-3.5 text-muted hover:text-text-primary transition-colors" />
            )}
          </button>

          {isUser ? (
            /* Edit Button for User Messages */
            <button
              onClick={handleEditStart}
              disabled={isOtherMessageEditing}
              className="p-1.5 rounded-md hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Edit message"
              title="Edit"
            >
              <PencilIcon className="w-3.5 h-3.5 text-muted hover:text-text-primary transition-colors" />
            </button>
          ) : (
            /* Regenerate Button for AI Messages */
            <button
              onClick={() => onRegenerate(message.id)}
              disabled={isOtherMessageEditing}
              className="p-1.5 rounded-md hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Regenerate response"
              title="Regenerate"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-muted hover:text-text-primary transition-colors" />
            </button>
          )}

          {/* Timestamp */}
          <span className="text-xs text-muted px-1">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
});