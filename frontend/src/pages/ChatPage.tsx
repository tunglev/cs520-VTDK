import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useConversationList, useChat, ConversationWithParticipant } from '../hooks/useChat';
import { Conversation } from '../models/reviews/ReviewsAndMessaging';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';

interface ChatPageProps {
  user: any;
}

function formatTime(isoString: string | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatPage({ user }: ChatPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetFreelancerId = searchParams.get('with');

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [initiating, setInitiating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { conversations, loading: convsLoading, refetch } = useConversationList(user?.id);
  const { messages, loading: msgsLoading, sending, sendMessage } = useChat(activeConversationId, user?.id);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If ?with=<freelancerId> query param is present, open/create that conversation
  useEffect(() => {
    if (!targetFreelancerId || !user?.id || convsLoading) return;

    const existing = conversations.find(
      (c) => c.freelancerId === targetFreelancerId || c.customerId === targetFreelancerId
    );

    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      // Create a new conversation
      setInitiating(true);
      const customerId = user.role === 'customer' ? user.id : targetFreelancerId;
      const freelancerId = user.role === 'customer' ? targetFreelancerId : user.id;

      Conversation.getOrCreate(customerId, freelancerId)
        .then((conv) => {
          setActiveConversationId(conv.id);
          refetch();
        })
        .catch(console.error)
        .finally(() => setInitiating(false));
    }
  }, [targetFreelancerId, user?.id, user?.role, convsLoading, conversations, refetch]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft('');
    await sendMessage(text);
    refetch(); // refresh last message preview in sidebar
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = convsLoading || initiating;

  return (
    <main className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 89px)' }}>
      <div className="flex flex-1 overflow-hidden border-t-4 border-black">

        {/* ── Sidebar: Conversation list ─────────────────────── */}
        <aside className="w-80 shrink-0 border-r-4 border-black bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b-4 border-black flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 font-mono text-xs uppercase hover:text-vibrant-coral transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <h1 className="font-display text-xl uppercase tracking-tighter">Messages</h1>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={20} className="animate-spin opacity-40" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <MessageSquare size={32} className="opacity-20" />
                <p className="font-mono text-xs uppercase opacity-40 leading-relaxed">
                  No conversations yet.<br />Message a freelancer to get started.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  onClick={() => setActiveConversationId(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Main: Message thread ───────────────────────────── */}
        <div className="flex-1 flex flex-col bg-bone overflow-hidden">
          {activeConversationId && activeConversation ? (
            <>
              {/* Thread header */}
              <div className="px-8 py-5 bg-white border-b-4 border-black flex items-center gap-4 shrink-0">
                <div className="w-10 h-10 bg-shadow-grey text-white font-display text-lg uppercase border-2 border-black shadow-brutal-sm flex items-center justify-center">
                  {activeConversation.otherUserInitial}
                </div>
                <div>
                  <div className="font-display uppercase text-base tracking-tight leading-none">
                    {activeConversation.otherUserName}
                  </div>
                  <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
                    {activeConversation.freelancerId === user?.id ? 'Customer' : 'Freelancer'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin opacity-40" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare size={28} className="opacity-20" />
                    <p className="font-mono text-xs uppercase opacity-40">
                      No messages yet. Say hello!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] px-4 py-3 border-2 border-black text-sm font-mono leading-relaxed shadow-brutal-sm',
                              isMine
                                ? 'bg-vibrant-coral text-white'
                                : 'bg-white text-shadow-grey'
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={cn(
                                'text-[10px] uppercase mt-1.5',
                                isMine ? 'text-white/60 text-right' : 'opacity-40'
                              )}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <div className="px-8 py-5 bg-white border-t-4 border-black shrink-0">
                <div className="flex items-end gap-4">
                  <textarea
                    ref={textareaRef}
                    id="chat-compose"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    rows={2}
                    className="flex-1 resize-none bg-bone border-2 border-black px-4 py-3 font-mono text-sm placeholder:opacity-40 focus:outline-none focus:border-vibrant-coral transition-colors"
                  />
                  <button
                    id="chat-send-btn"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className={cn(
                      'p-4 border-2 border-black font-display uppercase text-sm shadow-brutal-sm transition-all flex items-center gap-2',
                      draft.trim() && !sending
                        ? 'bg-vibrant-coral text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                        : 'bg-bone text-shadow-grey opacity-40 cursor-not-allowed'
                    )}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-20 h-20 bg-white border-4 border-black shadow-brutal flex items-center justify-center">
                <MessageSquare size={36} className="text-vibrant-coral" />
              </div>
              <h2 className="font-display text-3xl uppercase tracking-tighter">Your Messages</h2>
              <p className="font-mono text-sm opacity-50 max-w-sm leading-relaxed">
                Select a conversation from the left, or visit a freelancer's profile and click{' '}
                <span className="font-bold text-shadow-grey opacity-80">Message</span> to start a new chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ── ConversationRow ──────────────────────────────────────────

function ConversationRow({
  conv,
  isActive,
  onClick,
}: {
  conv: ConversationWithParticipant;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-5 py-4 border-b-2 border-black/10 text-left transition-all group',
        isActive
          ? 'bg-shadow-grey text-white'
          : 'hover:bg-bone'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-10 h-10 shrink-0 font-display text-lg uppercase border-2 border-black flex items-center justify-center shadow-brutal-sm transition-all',
          isActive ? 'bg-vibrant-coral text-white' : 'bg-bone text-shadow-grey group-hover:bg-vibrant-coral group-hover:text-white'
        )}
      >
        {conv.otherUserInitial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-display uppercase text-sm tracking-tight truncate', isActive ? 'text-white' : '')}>
            {conv.otherUserName}
          </span>
          <span className={cn('font-mono text-[9px] uppercase shrink-0', isActive ? 'text-white/50' : 'opacity-40')}>
            {formatTime(conv.lastMessageAt)}
          </span>
        </div>
        {conv.lastMessage && (
          <p className={cn('font-mono text-xs truncate mt-0.5', isActive ? 'text-white/60' : 'opacity-50')}>
            {conv.lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}
