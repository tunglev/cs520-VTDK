import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Conversation, Message } from '../models/reviews/ReviewsAndMessaging';

export interface ConversationWithParticipant extends Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserInitial: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export function useConversationList(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch conversations where the user is a participant
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('id, customer_id, freelancer_id, created_at')
        .or(`customer_id.eq.${userId},freelancer_id.eq.${userId}`);

      if (fetchError) throw fetchError;

      const enriched: ConversationWithParticipant[] = await Promise.all(
        (data ?? []).map(async (row: any) => {
          const isCustomer = row.customer_id === userId;
          const otherId = isCustomer ? row.freelancer_id : row.customer_id;

          // Fetch the other user's display name
          const { data: otherUser } = await supabase
            .from('users')
            .select('full_name, business_name, email')
            .eq('id', otherId)
            .single();

          const otherName = otherUser?.full_name || otherUser?.business_name || otherUser?.email?.split('@')[0] || 'User';

          // Fetch last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('body, created_at')
            .eq('conversation_id', row.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: row.id,
            customerId: row.customer_id,
            freelancerId: row.freelancer_id,
            createdAt: row.created_at,
            otherUserId: otherId,
            otherUserName: otherName,
            otherUserInitial: otherName.charAt(0).toUpperCase(),
            lastMessage: lastMsgData?.body ?? undefined,
            lastMessageAt: lastMsgData?.created_at ?? undefined,
            unreadCount: 0,
          };
        })
      );

      // Sort by most recent message
      enriched.sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.createdAt;
        const bTime = b.lastMessageAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(enriched);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

export function useChat(conversationId: string | null, currentUserId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load historical messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setMessages((data ?? []).map(Message.fromRow));
        }
        setLoading(false);
      });

    // Subscribe to new messages via Supabase Realtime
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = Message.fromRow(payload.new as Record<string, unknown>);
          setMessages((prev) => {
            // Deduplicate by id in case of optimistic updates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !currentUserId || !body.trim()) return;
      setSending(true);
      setError(null);
      try {
        const { error: insertError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          body: body.trim(),
        });
        if (insertError) throw insertError;
      } catch (err: any) {
        setError(err.message ?? 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [conversationId, currentUserId]
  );

  return { messages, loading, sending, error, sendMessage };
}
