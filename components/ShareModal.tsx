import React, { useState } from 'react';
import { Conversation } from '../types';
import { CheckIcon, ShareIcon, XIcon } from './Icons';

interface ShareModalProps {
    conversation: Conversation;
    isOpen: boolean;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ conversation, isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [copiedType, setCopiedType] = useState<'markdown' | 'text' | null>(null);

    const copyToClipboard = (text: string, type: 'markdown' | 'text') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setCopiedType(type);
            setTimeout(() => {
                setCopied(false);
                setCopiedType(null);
            }, 2000);
        });
    };

    const copyAsMarkdown = () => {
        let markdown = `# ${conversation.title}\n\n`;
        markdown += `*Shared from Druva AI Chat*\n\n---\n\n`;

        conversation.messages.forEach(msg => {
            const role = msg.role === 'user' ? '**You**' : '**Druva**';
            const time = new Date(msg.timestamp).toLocaleString();
            markdown += `### ${role} - ${time}\n\n${msg.content}\n\n---\n\n`;
        });

        copyToClipboard(markdown, 'markdown');
    };

    const copyAsText = () => {
        let text = `${conversation.title}\n`;
        text += `Shared from Druva AI Chat\n`;
        text += `${'='.repeat(50)}\n\n`;

        conversation.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Druva';
            const time = new Date(msg.timestamp).toLocaleString();
            text += `[${role}] - ${time}\n${msg.content}\n\n${'='.repeat(50)}\n\n`;
        });

        copyToClipboard(text, 'text');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-bkg border border-border-color rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-slideUp">
                <div className="flex items-center justify-between p-6 border-b border-border-color">
                    <div className="flex items-center gap-3">
                        <ShareIcon className="w-6 h-6 text-cyan-accent" />
                        <h2 className="text-xl font-bold text-text-primary">Share Conversation</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" aria-label="Close">
                        <XIcon className="w-5 h-5 text-muted" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-4 rounded-lg bg-surface border border-border-color">
                        <h3 className="font-semibold text-text-primary mb-2">{conversation.title}</h3>
                        <p className="text-sm text-muted">
                            {conversation.messages.length} messages • Created {new Date(conversation.messages[0]?.timestamp || Date.now()).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-text-primary">Copy conversation as:</h4>

                        <button onClick={copyAsMarkdown} className="w-full p-4 rounded-lg border border-border-color hover:border-cyan-accent hover:bg-surface-hover transition-all text-left group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-primary">Copy as Markdown</p>
                                        <p className="text-xs text-muted">Formatted text for GitHub, Notion, etc.</p>
                                    </div>
                                </div>
                                {copied && copiedType === 'markdown' ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <span className="text-xs text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</span>
                                )}
                            </div>
                        </button>

                        <button onClick={copyAsText} className="w-full p-4 rounded-lg border border-border-color hover:border-cyan-accent hover:bg-surface-hover transition-all text-left group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-text-primary">Copy as Plain Text</p>
                                        <p className="text-xs text-muted">Simple text format for emails, notes</p>
                                    </div>
                                </div>
                                {copied && copiedType === 'text' ? (
                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</span>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="p-4 rounded-lg bg-cyan-accent/5 border border-cyan-accent/20">
                        <p className="text-xs text-muted">
                            💡 <strong>Tip:</strong> Copy your conversation and share it anywhere - in documents, emails, or messaging apps!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
