import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, XIcon, ArcReactorLogo, TrashIcon, MessageIcon, ThreeDotsIcon, ShareIcon } from './Icons';
import { Conversation } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onShareConversation: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onShareConversation
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    setActiveDropdownId(null);
    setTimeout(() => {
      onDeleteConversation(id);
      setDeletingId(null);
    }, 300);
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShareConversation(id);
    setActiveDropdownId(null);
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-label="Close sidebar overlay"
        aria-hidden="true"
      />
      <aside
        className={`fixed lg:relative flex flex-col h-full bg-surface border-r border-border-color transition-all duration-300 ease-in-out z-50 lg:z-auto ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
          }`}
      >
        <div className={`flex items-center p-4 border-b border-border-color ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-2">
              <ArcReactorLogo className="w-8 h-8 text-cyan-accent" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-accent to-blue-500 bg-clip-text text-transparent">Druva</h1>
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-surface-hover transition-all" aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}>
            {isOpen ? <XIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />}
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-3 p-3 rounded-lg bg-cyan-accent text-white hover:bg-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg ${isOpen ? '' : 'justify-center'}`}
            aria-label="Start new chat"
          >
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-semibold">New Chat</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {isOpen && conversations.length > 0 && (
            <div className="text-xs font-semibold text-muted px-3 py-2">Recent</div>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative flex items-center rounded-lg transition-all duration-300 ${deletingId === conv.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                } ${conv.id === activeConversationId
                  ? 'bg-surface-hover'
                  : 'hover:bg-surface-hover'
                }`}
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectConversation(conv.id);
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                aria-label={`Select chat: ${conv.title}`}
                aria-current={conv.id === activeConversationId ? 'page' : undefined}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm truncate flex-1 ${isOpen ? '' : 'justify-center'
                  }`}
              >
                <MessageIcon className="w-4 h-4 flex-shrink-0 text-muted" />
                {isOpen && <span className="truncate">{conv.title}</span>}
              </a>

              {isOpen && (
                <div className="relative">
                  <button
                    onClick={(e) => toggleDropdown(conv.id, e)}
                    className={`p-2 mr-2 rounded-md hover:bg-surface-hover text-muted transition-all duration-200 ${activeDropdownId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    aria-label="Conversation options"
                  >
                    <ThreeDotsIcon className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeDropdownId === conv.id && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border-color rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn"
                    >
                      <button
                        onClick={(e) => handleShare(conv.id, e)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        <ShareIcon className="w-4 h-4" />
                        Share Conversation
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors border-t border-border-color"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete Conversation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {isOpen && (
          <div className="p-4 border-t border-border-color">
            <div className="text-xs text-muted text-center">
              <p>Made with ❤️</p>
              <p className="mt-1 text-cyan-accent">Created by Akash S</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};