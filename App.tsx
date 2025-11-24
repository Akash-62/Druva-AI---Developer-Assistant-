import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { RightPanel } from './components/RightPanel';
import { ShareModal } from './components/ShareModal';
import { useTheme } from './hooks/useDarkMode';
import { Conversation, Message } from './types';
import { groqStream } from './services/groqService';
import { CogIcon } from './components/Icons';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useTheme();

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('druva-conversations');
    const savedActiveId = localStorage.getItem('druva-active-conversation');

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(savedActiveId || parsed[0].id);
          return; // Exit early if we loaded saved conversations
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }

    // Only create new chat if no saved conversations exist
    handleNewChat();
  }, []); // Remove handleNewChat dependency to avoid re-running

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('druva-conversations', JSON.stringify(conversations));
      if (activeConversationId) {
        localStorage.setItem('druva-active-conversation', activeConversationId);
      }
    }
  }, [conversations, activeConversationId]);

  const handleNewChat = useCallback(() => {
    const newConversationId = `chat-${Date.now()}`;
    const newConversation: Conversation = {
      id: newConversationId,
      title: 'New Chat',
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversationId);
    setEditingMessageId(null);
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setEditingMessageId(null);
  };

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);

      // If deleting active conversation, switch to another or create new
      if (id === activeConversationId) {
        if (filtered.length > 0) {
          setActiveConversationId(filtered[0].id);
        } else {
          // Create a new conversation if all are deleted
          const newConversationId = `chat-${Date.now()}`;
          const newConversation: Conversation = {
            id: newConversationId,
            title: 'New Chat',
            messages: [],
          };
          setActiveConversationId(newConversationId);
          return [newConversation];
        }
      }

      // Clear localStorage if no conversations left
      if (filtered.length === 0) {
        localStorage.removeItem('druva-conversations');
        localStorage.removeItem('druva-active-conversation');
      }

      return filtered;
    });
    setEditingMessageId(null);
  }, [activeConversationId]);

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !activeConversationId) return;

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };

    const isFirstMessage = activeConversation?.messages.length === 0;

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          title: isFirstMessage ? text.substring(0, 40) + (text.length > 40 ? '...' : '') : conv.title,
          messages: [...conv.messages, userMessage],
        };
      }
      return conv;
    }));

    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return { ...conv, messages: [...conv.messages, assistantPlaceholder] };
      }
      return conv;
    }));

    try {
      // Convert conversation history to Groq format
      const history = activeConversation?.messages
        .filter(msg => msg.id !== assistantMessageId) // Exclude the placeholder
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })) || [];

      const stream = groqStream(text, history, abortController.signal);
      let content = '';
      for await (const chunk of stream) {
        content += chunk;
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: content } : msg
                ),
              };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Generation stopped by user');
        return;
      }
      console.error("Error streaming response:", error);
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === assistantMessageId ? { ...msg, content: "Sorry, I encountered an error." } : msg
              ),
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [activeConversationId, activeConversation]);

  const handleSaveEdit = useCallback(async (messageId: string, newContent: string) => {
    if (!activeConversationId || !newContent.trim()) {
      setEditingMessageId(null);
      return;
    }

    let originalContent = '';
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        const messageIndex = conv.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) return conv;

        originalContent = conv.messages[messageIndex].content;
        const updatedHistory = conv.messages.slice(0, messageIndex);
        updatedHistory.push({ ...conv.messages[messageIndex], content: newContent.trim(), timestamp: Date.now() });

        return { ...conv, messages: updatedHistory };
      }
      return conv;
    }));

    setEditingMessageId(null);

    if (originalContent.trim() === newContent.trim()) return;

    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return { ...conv, messages: [...conv.messages, assistantPlaceholder] };
      }
      return conv;
    }));

    try {
      // Get updated conversation state for history
      const updatedConv = conversations.find(c => c.id === activeConversationId);
      const history = updatedConv?.messages
        .filter(msg => msg.id !== assistantMessageId) // Exclude the placeholder
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })) || [];

      const stream = groqStream(newContent, history);
      let content = '';
      for await (const chunk of stream) {
        content += chunk;
        setConversations(prev =>
          prev.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: content } : msg
                ),
              };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error("Error streaming response after edit:", error);
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === assistantMessageId ? { ...msg, content: "Sorry, I encountered an error." } : msg
              ),
            };
          }
          return conv;
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, activeConversation, conversations]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (!activeConversationId) return;
    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv) return;

    let messageIndex = activeConv.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // If it's an assistant message, find the preceding user message
    if (activeConv.messages[messageIndex].role === 'assistant') {
      messageIndex = messageIndex - 1;
    }

    // Ensure we have a valid user message to regenerate from
    if (messageIndex < 0 || activeConv.messages[messageIndex].role !== 'user') return;

    const messageToRegenerate = activeConv.messages[messageIndex];
    const historyToKeep = activeConv.messages.slice(0, messageIndex + 1);

    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId ? { ...conv, messages: historyToKeep } : conv
    ));

    setTimeout(() => {
      setIsLoading(true);

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantPlaceholder: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() };

      setConversations(prev => prev.map(conv => {
        if (conv.id === activeConversationId) {
          return { ...conv, messages: [...conv.messages, assistantPlaceholder] };
        }
        return conv;
      }));

      (async () => {
        try {
          // Get conversation history up to the message being regenerated
          const currentConv = conversations.find(c => c.id === activeConversationId);
          const history = currentConv?.messages
            .slice(0, messageIndex + 1) // Include the message being regenerated
            .filter(msg => msg.id !== assistantMessageId) // Exclude the placeholder
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })) || [];

          const stream = groqStream(messageToRegenerate.content, history);
          let content = '';
          for await (const chunk of stream) {
            content += chunk;
            setConversations(prev =>
              prev.map(conv => {
                if (conv.id === activeConversationId) {
                  return {
                    ...conv, messages: conv.messages.map(msg =>
                      msg.id === assistantMessageId ? { ...msg, content: content } : msg
                    ),
                  };
                }
                return conv;
              })
            );
          }
        } catch (error) {
          console.error("Error streaming response on regenerate:", error);
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id === activeConversationId) {
                return {
                  ...conv, messages: conv.messages.map(msg =>
                    msg.id === assistantMessageId ? { ...msg, content: "Sorry, I encountered an error." } : msg
                  ),
                };
              }
              return conv;
            })
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }, 50);
  }, [conversations, activeConversationId]);

  // Adjust sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // Mobile: both closed by default
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      } else if (window.innerWidth < 1024) {
        // Tablet: sidebar closed, right panel closed
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      } else if (window.innerWidth < 1280) {
        // Small desktop: sidebar open, right panel closed
        setIsSidebarOpen(true);
        setIsRightPanelOpen(false);
      } else {
        // Large desktop: both open
        setIsSidebarOpen(true);
        setIsRightPanelOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={'flex h-screen font-sans bg-bkg text-text-primary transition-colors duration-300'}>
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex flex-col flex-1 relative">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          toggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          isRightPanelOpen={isRightPanelOpen}
          onShare={() => setIsShareModalOpen(true)}
          hasMessages={activeConversation?.messages.length ? activeConversation.messages.length > 0 : false}
        />
        <main className="flex-1 overflow-y-auto relative">
          <ChatArea
            messages={activeConversation?.messages || []}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            editingMessageId={editingMessageId}
            onSetEditingMessageId={setEditingMessageId}
            onSaveEdit={handleSaveEdit}
            onRegenerate={handleRegenerate}
            onStopGenerating={handleStopGenerating}
          />
        </main>
      </div>

      <RightPanel isOpen={isRightPanelOpen} setIsOpen={setIsRightPanelOpen} />

      {/* Share Modal */}
      {activeConversation && (
        <ShareModal
          conversation={activeConversation}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;