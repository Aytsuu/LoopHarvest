import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChatSupabaseClient = SupabaseClient<any, any>;

export interface ChatThreadRow {
  id: string;
  listing_id: string | null;
  participant_a_id: string;
  participant_a_name: string | null;
  participant_a_avatar_url: string | null;
  participant_b_id: string;
  participant_b_name: string | null;
  participant_b_avatar_url: string | null;
  created_by: string;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  participant_a_last_read_at: string;
  participant_b_last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  is_system: boolean;
  message_type: "text" | "system" | "claim_request" | "handoff_request";
  message_metadata: {
    listing_id?: string;
    requested_by_user_id?: string;
    recipient_user_id?: string;
    status?: "pending" | "completed";
    completed_at?: string | null;
    completed_by_user_id?: string | null;
  } | null;
  created_at: string;
}

export interface ChatListingSnapshot {
  id: string;
  donor_id: string;
  title: string;
  quantity_kg: string;
  photo_url: string | null;
  claim_type: "direct" | "message";
  status: "open" | "claimed" | "completed";
  claimed_by: string | null;
}

export function formatChatTimestamp(value: string | null, fallback = "Just now") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeChatTime(value: string | null, fallback = "Just now") {
  if (!value) {
    return fallback;
  }

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) {
    return fallback;
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getOtherParticipant(thread: ChatThreadRow, currentUserId: string) {
  const isParticipantA = thread.participant_a_id === currentUserId;

  return {
    id: isParticipantA ? thread.participant_b_id : thread.participant_a_id,
    name: isParticipantA
      ? (thread.participant_b_name ?? "LoopHarvest Member")
      : (thread.participant_a_name ?? "LoopHarvest Member"),
    avatarUrl: isParticipantA
      ? thread.participant_b_avatar_url
      : thread.participant_a_avatar_url,
  };
}

export function isThreadUnread(thread: ChatThreadRow, currentUserId: string) {
  if (!thread.last_message_at || !thread.last_message_sender_id || thread.last_message_sender_id === currentUserId) {
    return false;
  }

  const lastMessageAt = new Date(thread.last_message_at).getTime();
  const lastReadAt = new Date(
    thread.participant_a_id === currentUserId
      ? thread.participant_a_last_read_at
      : thread.participant_b_last_read_at,
  ).getTime();

  if (Number.isNaN(lastMessageAt) || Number.isNaN(lastReadAt)) {
    return false;
  }

  return lastMessageAt > lastReadAt;
}

export function countUnreadThreads(threads: ChatThreadRow[], currentUserId: string) {
  return threads.filter((thread) => isThreadUnread(thread, currentUserId)).length;
}

export async function fetchChatThreads(supabase: ChatSupabaseClient, currentUserId: string) {
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .or(`participant_a_id.eq.${currentUserId},participant_b_id.eq.${currentUserId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatThreadRow[];
}

export async function fetchChatMessages(supabase: ChatSupabaseClient, threadId: string) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessageRow[];
}

export async function fetchChatListings(supabase: ChatSupabaseClient, listingIds: string[]) {
  if (listingIds.length === 0) {
    return {} as Record<string, ChatListingSnapshot>;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id,donor_id,title,quantity_kg,photo_url,claim_type,status,claimed_by")
    .in("id", listingIds);

  if (error) {
    throw error;
  }

  return Object.fromEntries(
    ((data ?? []) as ChatListingSnapshot[]).map((listing) => [listing.id, listing]),
  );
}
