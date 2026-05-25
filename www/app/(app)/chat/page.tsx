'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Scale,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Handshake,
} from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import {
  countUnreadThreads,
  fetchChatListings,
  fetchChatMessages,
  fetchChatThreads,
  formatChatTimestamp,
  formatRelativeChatTime,
  getOtherParticipant,
  isThreadUnread,
  type ChatMessageRow,
  type ChatThreadRow,
} from '@/lib/chat';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [supabase] = React.useState(() => createSupabaseClient());

  const queryThreadId = searchParams.get('threadId');
  const queryListingId = searchParams.get('listingId');
  const queryRecipientId = searchParams.get('recipientId');
  const queryRecipientName = searchParams.get('recipientName');
  const queryRecipientAvatar = searchParams.get('recipientAvatar');
  const bootstrapThreadRef = React.useRef(false);

  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [inputText, setInputText] = React.useState('');
  const [showSidebarOnMobile, setShowSidebarOnMobile] = React.useState(true);
  const [handoffSuccess, setHandoffSuccess] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [isRecipientTyping, setIsRecipientTyping] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = React.useRef<number | null>(null);
  const localTypingStopTimeoutRef = React.useRef<number | null>(null);
  const typingChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentAtRef = React.useRef(0);

  const { data: currentUser } = useQuery({
    queryKey: ['chat-current-user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error('You need to be signed in to open messages.');
      }

      return user;
    },
  });

  const clearRecipientTyping = React.useCallback(() => {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsRecipientTyping(false);
  }, [setIsRecipientTyping]);

  const sendTypingState = async (isTyping: boolean) => {
    if (!typingChannelRef.current || !activeThreadId || activeThreadId === 'temp-thread-id' || !currentUser?.id) {
      return;
    }

    await typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        threadId: activeThreadId,
        senderId: currentUser.id,
        isTyping,
      },
    });
  };

  const {
    data: threads = [],
    isLoading: threadsLoading,
    isFetched: threadsFetched,
  } = useQuery({
    queryKey: ['chat-threads', currentUser?.id],
    queryFn: () => fetchChatThreads(supabase, currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const listingIds = React.useMemo(() => {
    const ids = threads.map((thread) => thread.listing_id).filter((value): value is string => !!value);
    if (queryListingId) {
      ids.push(queryListingId);
    }
    return Array.from(new Set(ids));
  }, [threads, queryListingId]);

  const { data: listingsById = {} } = useQuery({
    queryKey: ['chat-thread-listings', listingIds.join(',')],
    queryFn: () => fetchChatListings(supabase, listingIds),
    enabled: listingIds.length > 0,
  });

  const {
    data: activeMessages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['chat-messages', activeThreadId],
    queryFn: () => fetchChatMessages(supabase, activeThreadId!),
    enabled: !!activeThreadId && activeThreadId !== 'temp-thread-id',
  });

  const openThreadMutation = useMutation({
    mutationFn: async ({ otherUserId, listingId }: { otherUserId: string; listingId: string | null }) => {
      const { data, error } = await supabase.rpc('get_or_create_chat_thread', {
        p_other_user_id: otherUserId,
        p_listing_id: listingId,
      });

      if (error) {
        throw error;
      }

      return data as ChatThreadRow;
    },
    onSuccess: (thread) => {
      setChatError(null);
      setActiveThreadId(thread.id);
      setShowSidebarOnMobile(false);
      queryClient.setQueryData<ChatThreadRow[]>(['chat-threads', currentUser?.id], (existing = []) => {
        const matchIndex = existing.findIndex((entry) => entry.id === thread.id);
        if (matchIndex >= 0) {
          const next = [...existing];
          next[matchIndex] = thread;
          return next;
        }
        return [thread, ...existing];
      });
      void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] });
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to open this conversation.');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, body }: { threadId: string; body: string }) => {
      const { data, error } = await supabase.rpc('send_chat_message', {
        p_thread_id: threadId,
        p_body: body,
      });

      if (error) {
        throw error;
      }

      return data as ChatMessageRow;
    },
    onSuccess: (message) => {
      setChatError(null);
      setInputText('');
      queryClient.setQueryData<ChatMessageRow[]>(['chat-messages', message.thread_id], (existing = []) =>
        existing.some((entry) => entry.id === message.id) ? existing : [...existing, message],
      );
      void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] });
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to send this message.');
    },
  });

  const sendHandoffRequestMutation = useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      const { data, error } = await supabase.rpc('send_handoff_request_message', {
        p_thread_id: threadId,
      });

      if (error) {
        throw error;
      }

      return data as ChatMessageRow;
    },
    onSuccess: (message) => {
      setChatError(null);
      queryClient.setQueryData<ChatMessageRow[]>(['chat-messages', message.thread_id], (existing = []) =>
        existing.some((entry) => entry.id === message.id) ? existing : [...existing, message],
      );
      void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] });
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to send handoff confirmation request.');
    },
  });

  const sendClaimRequestMutation = useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      const { data, error } = await supabase.rpc('send_claim_request_message', {
        p_thread_id: threadId,
      });

      if (error) {
        throw error;
      }

      return data as ChatMessageRow;
    },
    onSuccess: (message) => {
      setChatError(null);
      queryClient.setQueryData<ChatMessageRow[]>(['chat-messages', message.thread_id], (existing = []) =>
        existing.some((entry) => entry.id === message.id) ? existing : [...existing, message],
      );
      void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] });
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to send claim confirmation request.');
    },
  });

  const claimFromThreadMutation = useMutation({
    mutationFn: async ({ listingId, threadId, actorName }: { listingId: string; threadId: string; actorName: string }) => {
      await apiClient.claimListing(listingId);

      const { error } = await supabase.rpc('append_system_chat_message', {
        p_thread_id: threadId,
        p_body: `${actorName} accepted the listing claim. Pickup coordination can begin.`,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      setChatError(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] }),
        queryClient.invalidateQueries({ queryKey: ['chat-thread-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.threadId] }),
      ]);
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to claim this listing from the thread.');
    },
  });

  const completeHandoffMutation = useMutation({
    mutationFn: async ({ listingId, threadId, actorName }: { listingId: string; threadId: string; actorName: string }) => {
      await apiClient.completeListing(listingId);

      const { error } = await supabase.rpc('append_system_chat_message', {
        p_thread_id: threadId,
        p_body: `Handoff verified by ${actorName}. Circular loop established!`,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      setChatError(null);
      setHandoffSuccess(true);
      setTimeout(() => setHandoffSuccess(false), 4500);

      window.dispatchEvent(new CustomEvent('post-created', {
        detail: 'Loop finalized! You unlocked +25 XP for composting surplus food.',
      }));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({ queryKey: ['impact'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser?.id] }),
        queryClient.invalidateQueries({ queryKey: ['chat-thread-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.threadId] }),
      ]);
    },
    onError: (err) => {
      setChatError(err instanceof Error ? err.message : 'Unable to finalize handoff. Please try again.');
    },
  });

  React.useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    if (queryThreadId && threadsFetched && !bootstrapThreadRef.current) {
      bootstrapThreadRef.current = true;
      const existingThread = threads.find((thread) => thread.id === queryThreadId);

      if (existingThread) {
        const timeoutId = window.setTimeout(() => {
          setActiveThreadId(existingThread.id);
          setShowSidebarOnMobile(false);
        }, 0);
        return () => window.clearTimeout(timeoutId);
      }

      if (threads.length > 0) {
        const timeoutId = window.setTimeout(() => {
          setActiveThreadId(threads[0].id);
          setShowSidebarOnMobile(false);
        }, 0);
        return () => window.clearTimeout(timeoutId);
      }
    }

    if (queryListingId && queryRecipientId && threadsFetched && !bootstrapThreadRef.current) {
      bootstrapThreadRef.current = true;
      const existingThread = threads.find((thread) =>
        thread.listing_id === queryListingId &&
        (thread.participant_a_id === queryRecipientId || thread.participant_b_id === queryRecipientId),
      );

      if (existingThread) {
        const timeoutId = window.setTimeout(() => {
          setActiveThreadId(existingThread.id);
          setShowSidebarOnMobile(false);
        }, 0);
        return () => window.clearTimeout(timeoutId);
      }

      openThreadMutation.mutate({
        otherUserId: queryRecipientId,
        listingId: queryListingId,
      });
      return;
    }

    if (!queryListingId && !queryThreadId && !activeThreadId && threads.length > 0) {
      const timeoutId = window.setTimeout(() => {
        setActiveThreadId(threads[0].id);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [activeThreadId, currentUser?.id, openThreadMutation, queryListingId, queryRecipientId, queryThreadId, threads, threadsFetched]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  React.useEffect(() => {
    return () => {
      clearRecipientTyping();
      if (localTypingStopTimeoutRef.current !== null) {
        window.clearTimeout(localTypingStopTimeoutRef.current);
      }
    };
  }, [clearRecipientTyping]);

  let activeThread = (activeThreadId ? threads.find((thread) => thread.id === activeThreadId) : null) ?? null;

  // Fallback / temporary active thread if none found in threads list but we have queryRecipientId
  if (!activeThread && currentUser?.id && queryRecipientId && queryRecipientName) {
    activeThread = {
      id: 'temp-thread-id',
      listing_id: queryListingId,
      participant_a_id: currentUser.id,
      participant_a_name: currentUser.user_metadata?.display_name || 'You',
      participant_a_avatar_url: currentUser.user_metadata?.avatar_url || null,
      participant_b_id: queryRecipientId,
      participant_b_name: queryRecipientName,
      participant_b_avatar_url: queryRecipientAvatar,
      created_by: currentUser.id,
      last_message_body: null,
      last_message_at: null,
      last_message_sender_id: null,
      participant_a_last_read_at: new Date().toISOString(),
      participant_b_last_read_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const activeThreadOtherParticipant = activeThread && currentUser?.id
    ? getOtherParticipant(activeThread, currentUser.id)
    : null;

  const activeListing = activeThread?.listing_id ? listingsById[activeThread.listing_id] : undefined;
  const isCurrentUserDonor = !!activeListing && activeListing.donor_id === currentUser?.id;
  const latestClaimRequestMessage = [...activeMessages]
    .reverse()
    .find((message) => message.message_type === 'claim_request' && message.message_metadata?.listing_id === activeThread?.listing_id) ?? null;
  const latestHandoffRequestMessage = [...activeMessages]
    .reverse()
    .find((message) => message.message_type === 'handoff_request' && message.message_metadata?.listing_id === activeThread?.listing_id) ?? null;
  const hasPendingClaimRequest = !!latestClaimRequestMessage && activeListing?.status === 'open';
  const hasPendingHandoffRequest = !!latestHandoffRequestMessage && activeListing?.status !== 'completed';

  React.useEffect(() => {
    if (!currentUser?.id || !activeThread || activeThread.id === 'temp-thread-id' || !isThreadUnread(activeThread, currentUser.id)) {
      return;
    }

    void supabase.rpc('mark_chat_thread_read', {
      p_thread_id: activeThread.id,
    }).then(({ error }) => {
      if (!error) {
        void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser.id] });
      }
    });
  }, [activeMessages.length, activeThread, currentUser?.id, queryClient, supabase]);

  React.useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const invalidateThreads = () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser.id] });
      void queryClient.invalidateQueries({ queryKey: ['chat-thread-listings'] });
    };

    const participantAChannel = supabase
      .channel(`chat-threads-a-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'api',
          table: 'chat_threads',
          filter: `participant_a_id=eq.${currentUser.id}`,
        },
        invalidateThreads,
      )
      .subscribe();

    const participantBChannel = supabase
      .channel(`chat-threads-b-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'api',
          table: 'chat_threads',
          filter: `participant_b_id=eq.${currentUser.id}`,
        },
        invalidateThreads,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(participantAChannel);
      void supabase.removeChannel(participantBChannel);
    };
  }, [currentUser?.id, queryClient, supabase]);

  React.useEffect(() => {
    if (!activeThreadId || activeThreadId === 'temp-thread-id' || !currentUser?.id) {
      return;
    }

    const messageChannel = supabase
      .channel(`chat-messages-${activeThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'api',
          table: 'chat_messages',
          filter: `thread_id=eq.${activeThreadId}`,
        },
        (payload) => {
          const message = payload.new as ChatMessageRow;
          queryClient.setQueryData<ChatMessageRow[]>(['chat-messages', activeThreadId], (existing = []) =>
            existing.some((entry) => entry.id === message.id) ? existing : [...existing, message],
          );
          void queryClient.invalidateQueries({ queryKey: ['chat-threads', currentUser.id] });
        },
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          const data = payload.payload as {
            threadId?: string;
            senderId?: string;
            isTyping?: boolean;
          };

          if (data.threadId !== activeThreadId || data.senderId === currentUser.id) {
            return;
          }

          if (!data.isTyping) {
            clearRecipientTyping();
            return;
          }

          setIsRecipientTyping(true);
          if (typingTimeoutRef.current !== null) {
            window.clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = window.setTimeout(() => {
            setIsRecipientTyping(false);
            typingTimeoutRef.current = null;
          }, 2500);
        },
      )
      .subscribe();

    typingChannelRef.current = messageChannel;

    return () => {
      typingChannelRef.current = null;
      clearRecipientTyping();
      void supabase.removeChannel(messageChannel);
    };
  }, [activeThreadId, clearRecipientTyping, currentUser?.id, queryClient, supabase]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputText(value);

    if (!activeThreadId || activeThreadId === 'temp-thread-id') {
      return;
    }

    const now = Date.now();
    if (value.trim() && now - lastTypingSentAtRef.current > 1200) {
      lastTypingSentAtRef.current = now;
      void sendTypingState(true);
    }

    if (localTypingStopTimeoutRef.current !== null) {
      window.clearTimeout(localTypingStopTimeoutRef.current);
    }

    localTypingStopTimeoutRef.current = window.setTimeout(() => {
      void sendTypingState(false);
      localTypingStopTimeoutRef.current = null;
    }, 1800);
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeThreadId || !inputText.trim()) {
      return;
    }

    if (localTypingStopTimeoutRef.current !== null) {
      window.clearTimeout(localTypingStopTimeoutRef.current);
      localTypingStopTimeoutRef.current = null;
    }
    void sendTypingState(false);

    sendMessageMutation.mutate({
      threadId: activeThreadId,
      body: inputText.trim(),
    });
  };

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
    setShowSidebarOnMobile(false);
    setChatError(null);
    clearRecipientTyping();
  };

  const unreadCount = currentUser?.id ? countUnreadThreads(threads, currentUser.id) : 0;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] flex flex-col md:h-screen">
      {handoffSuccess && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#A8D97F]/30 p-8 rounded-[2rem] text-center max-w-sm space-y-4 shadow-2xl animate-scale-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#A8D97F]/20 text-[#A8D97F] border border-[#A8D97F]/30 animate-bounce">
              <Handshake size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-black text-[#FFFFFF]">Circular Handoff Finalized!</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                You successfully diverted surplus food waste. You earned <span className="text-[#A8D97F] font-black">+25 XP</span> & <span className="text-[#A8D97F] font-black">+15 Loop Points</span>!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <section className={`absolute inset-0 z-20 bg-[#0A0A0A] w-full md:relative md:w-80 border-r border-white/6 flex flex-col transition-transform duration-300 ${
          showSidebarOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b border-white/6 bg-[#141414]/90 flex items-center justify-between">
            <div>
              <h1 className="font-display text-lg font-extrabold tracking-tight text-[#FFFFFF]">Messages</h1>
              <p className="text-[10px] text-[#8C8F7E] mt-1">
                {unreadCount > 0 ? `${unreadCount} unread conversation${unreadCount === 1 ? '' : 's'}` : 'Realtime coordination inbox'}
              </p>
            </div>
            <div className="h-7 w-7 rounded-full bg-[#2A4A10]/30 border border-[#A8D97F]/20 flex items-center justify-center text-[#A8D97F]">
              <MessageSquare size={14} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/4 p-2 space-y-1 scrollbar-none">
            {threadsLoading ? (
              <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <MessageSquare className="text-white/10 mb-2" size={32} />
                <p className="text-xs text-[#A3A3A3] font-bold uppercase tracking-wider">
                  {openThreadMutation.isPending ? 'Opening conversation' : 'No active coordination'}
                </p>
                <p className="text-[10px] text-[#8C8F7E] mt-1">
                  {openThreadMutation.isPending
                    ? 'Creating a realtime thread with the donor now.'
                    : 'Start chatting by clicking &quot;Message Donor&quot; on open scrap listings.'}
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const isUnread = currentUser?.id ? isThreadUnread(thread, currentUser.id) : false;
                const otherParticipant = currentUser?.id ? getOtherParticipant(thread, currentUser.id) : null;
                const listing = thread.listing_id ? listingsById[thread.listing_id] : undefined;
                const avatarFallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherParticipant?.name ?? 'LoopHarvestMember')}`;

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadSelect(thread.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left relative cursor-pointer ${
                      isActive
                        ? 'bg-[#2A4A10]/30 border border-[#A8D97F]/20 text-white'
                        : 'border border-transparent hover:bg-white/4 text-[#A3A3A3] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={otherParticipant?.avatarUrl ?? avatarFallback}
                        alt={otherParticipant?.name ?? 'LoopHarvest Member'}
                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                      />
                      {isUnread ? (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#E05656] border-2 border-[#0A0A0A]" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#FFFFFF] truncate">{otherParticipant?.name ?? 'LoopHarvest Member'}</span>
                        <span className="text-[9px] text-[#8C8F7E] font-medium">
                          {formatRelativeChatTime(thread.last_message_at ?? thread.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A3A3A3] truncate mt-0.5">
                        {thread.last_message_body ?? 'Started a coordination chat.'}
                      </p>

                      {listing ? (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] font-black text-[#A8D97F] bg-[#2A4A10]/40 px-2 py-0.5 rounded-md border border-[#A8D97F]/10 w-fit">
                          <Scale size={9} />
                          <span>{listing.title}</span>
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="flex-1 flex flex-col bg-[#141414]/30 min-w-0">
          {activeThread && activeThreadOtherParticipant ? (
            <>
              <div className="p-4 border-b border-white/6 bg-[#141414]/90 flex items-center gap-3">
                <button
                  onClick={() => setShowSidebarOnMobile(true)}
                  className="md:hidden rounded-full p-1 border border-white/10 hover:bg-white/8 transition cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeThreadOtherParticipant.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeThreadOtherParticipant.name)}`}
                  alt={activeThreadOtherParticipant.name}
                  className="h-8 w-8 rounded-full border border-white/10"
                />

                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-extrabold text-[#FFFFFF] truncate">{activeThreadOtherParticipant.name}</span>
                  <span className="block text-[9px] text-[#A8D97F] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A8D97F] animate-pulse" />
                    <span>{activeThread.id === 'temp-thread-id' ? 'Establishing secure thread...' : 'Realtime Coordination'}</span>
                  </span>
                </div>
              </div>

              {activeListing ? (
                <div className="bg-[#141414] border-b border-white/6 p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in relative z-10">
                  <div 
                    onClick={() => router.push(`/listings/${activeListing.id}`)}
                    className="flex items-center gap-3 cursor-pointer group/listing-header hover:opacity-90 transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/listings/${activeListing.id}`);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeListing.photo_url ?? 'https://images.unsplash.com/photo-1557844352-761f2565b576?q=80&w=300&auto=format&fit=crop'}
                      alt={activeListing.title}
                      className="h-11 w-11 rounded-lg object-cover border border-white/10 group-hover/listing-header:border-[#A8D97F]/40 transition-all duration-200"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#FFFFFF] truncate group-hover/listing-header:text-[#A8D97F] transition-colors duration-200">{activeListing.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[#A8D97F] bg-[#2A4A10]/55 px-1.5 py-0.5 rounded border border-[#A8D97F]/10">
                          <Scale size={9} />
                          <span>{activeListing.quantity_kg} kg</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          activeListing.status === 'completed'
                            ? 'bg-[#2A4A10] text-[#A8D97F] border-[#A8D97F]/20'
                            : 'bg-[#E8A838]/10 text-[#E8A838] border-[#E8A838]/20'
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${activeListing.status === 'completed' ? 'bg-[#A8D97F]' : 'bg-[#E8A838] animate-pulse'}`} />
                          <span>{activeListing.status === 'completed' ? 'Handoff Verified' : activeListing.status === 'claimed' ? 'Recipient Matched' : 'Pickup Pending'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeThread.listing_id && isCurrentUserDonor && activeListing.claim_type === 'message' ? (
                    activeListing.status === 'open' ? (
                      <button
                        onClick={() => sendClaimRequestMutation.mutate({
                          threadId: activeThread.id,
                        })}
                        disabled={sendClaimRequestMutation.isPending || hasPendingClaimRequest || activeThread.id === 'temp-thread-id'}
                        className="h-9 px-4 rounded-lg bg-[#A8D97F] text-[10px] font-black uppercase tracking-wider text-[#1A3A05] hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {sendClaimRequestMutation.isPending ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare size={12} />
                            <span>{hasPendingClaimRequest ? 'Claim Ticket Sent' : 'Send Claim Ticket'}</span>
                          </>
                        )}
                      </button>
                    ) : activeListing.status === 'claimed' ? (
                      <button
                        onClick={() => sendHandoffRequestMutation.mutate({
                          threadId: activeThread.id,
                        })}
                        disabled={sendHandoffRequestMutation.isPending || hasPendingHandoffRequest || activeThread.id === 'temp-thread-id'}
                        className="h-9 px-4 rounded-lg bg-[#A8D97F] text-[10px] font-black uppercase tracking-wider text-[#1A3A05] hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {sendHandoffRequestMutation.isPending ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Handshake size={12} />
                            <span>{hasPendingHandoffRequest ? 'Confirmation Sent' : 'Send Handoff Confirmation'}</span>
                          </>
                        )}
                      </button>
                    ) : null
                  ) : null}
                </div>
              ) : null}

              {chatError ? (
                <div className="mx-4 mt-4 rounded-xl border border-[#E05656]/30 bg-[#7A1010]/20 px-4 py-3 text-sm text-[#FFB4AB]">
                  {chatError}
                </div>
              ) : null}

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
                <div className="max-w-xl mx-auto space-y-4 pb-24 md:pb-6">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8 text-[#A3A3A3]">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <div className="rounded-xl border border-white/6 bg-[#141414] p-4 text-center max-w-sm">
                        <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                          Start the pickup conversation. Messages here are stored in Supabase and update in realtime.
                        </p>
                      </div>
                    </div>
                  ) : (
                    activeMessages.map((message) => {
                      if (message.message_type === 'claim_request') {
                        const isReceiver = currentUser?.id === message.message_metadata?.recipient_user_id;
                        const isClaimed = activeListing?.status !== 'open';

                        return (
                          <div key={message.id} className="flex justify-center my-4 animate-scale-in">
                            <div className="rounded-[1.5rem] border border-[#E8A838]/20 bg-[#141414] p-4 max-w-md w-full text-center space-y-3">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/20">
                                <MessageSquare size={18} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-[#FFFFFF]">Claim confirmation requested</p>
                                <p className="text-[11px] leading-relaxed text-[#A3A3A3]">
                                  The donor invited the receiver to formally claim this listing so pickup coordination can proceed in the thread.
                                </p>
                              </div>

                              {isClaimed ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8A838]/20 bg-[#4D3105]/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#E8A838]">
                                  <CheckCircle2 size={12} />
                                  <span>Listing Claimed</span>
                                </div>
                              ) : isReceiver && activeThread?.listing_id ? (
                                <button
                                  onClick={() => claimFromThreadMutation.mutate({
                                    listingId: activeThread.listing_id!,
                                    threadId: activeThread.id,
                                    actorName: currentUser?.user_metadata?.display_name || currentUser?.email || 'The receiver',
                                  })}
                                  disabled={claimFromThreadMutation.isPending}
                                  className="mx-auto h-10 px-4 rounded-xl bg-[#E8A838] text-[10px] font-black uppercase tracking-wider text-[#2E1C00] hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {claimFromThreadMutation.isPending ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      <span>Claiming...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={12} />
                                      <span>Claim Listing</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <p className="text-[10px] font-semibold text-[#8C8F7E]">
                                  Waiting for the receiver to accept this listing claim.
                                </p>
                              )}

                              <span className="block text-[8px] text-[#8C8F7E] font-medium">
                                {formatChatTimestamp(message.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (message.message_type === 'handoff_request') {
                        const isReceiver = currentUser?.id === message.message_metadata?.recipient_user_id;
                        const isCompleted = activeListing?.status === 'completed';
                        const canReceiverFinalize = isReceiver && activeListing?.status === 'claimed';

                        return (
                          <div key={message.id} className="flex justify-center my-4 animate-scale-in">
                            <div className="rounded-[1.5rem] border border-[#A8D97F]/20 bg-[#141414] p-4 max-w-md w-full text-center space-y-3">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#A8D97F]/10 text-[#A8D97F] border border-[#A8D97F]/20">
                                <Handshake size={18} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-[#FFFFFF]">Handoff confirmation requested</p>
                                <p className="text-[11px] leading-relaxed text-[#A3A3A3]">
                                  The donor marked this exchange as ready. The receiver should confirm after the material is physically received.
                                </p>
                              </div>

                              {isCompleted ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#A8D97F]/20 bg-[#2A4A10]/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#A8D97F]">
                                  <CheckCircle2 size={12} />
                                  <span>Handoff Verified</span>
                                </div>
                              ) : canReceiverFinalize && activeThread?.listing_id ? (
                                <button
                                  onClick={() => completeHandoffMutation.mutate({
                                    listingId: activeThread.listing_id!,
                                    threadId: activeThread.id,
                                    actorName: currentUser?.user_metadata?.display_name || currentUser?.email || 'the receiver',
                                  })}
                                  disabled={completeHandoffMutation.isPending}
                                  className="mx-auto h-10 px-4 rounded-xl bg-[#A8D97F] text-[10px] font-black uppercase tracking-wider text-[#1A3A05] hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                  {completeHandoffMutation.isPending ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Handshake size={12} />
                                      <span>Finalize Handoff</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <p className="text-[10px] font-semibold text-[#8C8F7E]">
                                  Waiting for the receiver to confirm this handoff.
                                </p>
                              )}

                              <span className="block text-[8px] text-[#8C8F7E] font-medium">
                                {formatChatTimestamp(message.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (message.is_system) {
                        return (
                          <div key={message.id} className="flex justify-center my-4 animate-scale-in">
                            <div className="rounded-xl border border-white/6 bg-[#141414] p-3 px-4 max-w-sm text-center space-y-1">
                              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#A8D97F]/10 text-[#A8D97F]">
                                <CheckCircle2 size={12} />
                              </div>
                              <p className="text-[10px] font-medium leading-relaxed text-[#A3A3A3]">{message.body}</p>
                              <span className="block text-[8px] text-[#8C8F7E] font-medium">
                                {formatChatTimestamp(message.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const isMe = currentUser?.id === message.sender_id;
                      return (
                        <div key={message.id} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                          {!isMe ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={activeThreadOtherParticipant.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeThreadOtherParticipant.name)}`}
                              alt={activeThreadOtherParticipant.name}
                              className="h-7 w-7 rounded-full object-cover border border-white/10 self-end shrink-0"
                            />
                          ) : null}
                          <div className="space-y-1">
                            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#A8D97F] text-[#1A3A05] rounded-br-none font-medium'
                                : 'bg-[#141414] text-[#FFFFFF] rounded-bl-none border border-white/6 font-medium'
                            }`}>
                              <p className="whitespace-pre-line">{message.body}</p>
                            </div>
                            <span className={`block text-[8px] text-[#8C8F7E] font-semibold ${isMe ? 'text-right' : 'text-left'}`}>
                              {formatChatTimestamp(message.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isRecipientTyping && activeThreadOtherParticipant ? (
                    <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeThreadOtherParticipant.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeThreadOtherParticipant.name)}`}
                        alt={activeThreadOtherParticipant.name}
                        className="h-7 w-7 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="bg-[#141414] border border-white/6 p-2 px-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A8D97F] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A8D97F] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A8D97F] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="p-4 border-t border-white/6 bg-[#0A0A0A]/80 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-xl mx-auto flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onBlur={() => {
                      if (localTypingStopTimeoutRef.current !== null) {
                        window.clearTimeout(localTypingStopTimeoutRef.current);
                        localTypingStopTimeoutRef.current = null;
                      }
                      void sendTypingState(false);
                    }}
                    placeholder="Write a coordinating message..."
                    className="flex-1 h-11 px-4 rounded-xl border border-white/10 bg-[#141414] text-xs font-semibold focus:border-[#A8D97F] focus:outline-none placeholder:text-[#525252] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendMessageMutation.isPending || openThreadMutation.isPending || activeThread.id === 'temp-thread-id'}
                    className="h-11 w-11 shrink-0 bg-[#A8D97F] hover:bg-[#B8E890] disabled:bg-white/4 text-[#1A3A05] disabled:text-white/10 transition-colors rounded-xl flex items-center justify-center cursor-pointer"
                  >
                    {sendMessageMutation.isPending || openThreadMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <MessageSquare className="text-white/5 mb-3" size={48} />
              <p className="text-sm text-[#A3A3A3] font-bold uppercase tracking-wider">Select a conversation</p>
              <p className="text-xs text-[#8C8F7E] mt-1">Pick an active thread from the list to start coordinating handoffs.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
