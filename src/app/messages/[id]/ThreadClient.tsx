'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Flag, Ban, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Feedback';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { useCountsStore } from '@/hooks/useCounts';
import { api, imageUrl } from '@/lib/client';
import { cn, formatPrice } from '@/lib/utils';
import type { ConversationDTO, MessageDTO } from '@/types';

const POLL_MS = 5_000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ThreadClient({ conversationId }: { conversationId: string }) {
  const refreshCounts = useCountsStore((s) => s.refresh);
  const [conversation, setConversation] = useState<ConversationDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string | null>(null);

  const appendMessages = useCallback((incoming: MessageDTO[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id));
      const merged = [...current, ...incoming.filter((m) => !seen.has(m.id))];
      lastSeenRef.current = merged[merged.length - 1]?.createdAt ?? lastSeenRef.current;
      return merged;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ conversation: ConversationDTO; messages: MessageDTO[] }>(`/api/conversations/${conversationId}`)
      .then((data) => {
        if (cancelled) return;
        setConversation(data.conversation);
        appendMessages(data.messages);
        refreshCounts();
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [conversationId, appendMessages, refreshCounts]);

  useEffect(() => {
    if (!conversation) return;
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const after = lastSeenRef.current ? `?after=${encodeURIComponent(lastSeenRef.current)}` : '';
        const data = await api<{ messages: MessageDTO[] }>(`/api/conversations/${conversationId}${after}`);
        if (data.messages.length) {
          appendMessages(data.messages);
          refreshCounts();
        }
      } catch {
        // Retry on the next tick.
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [conversation, conversationId, appendMessages, refreshCounts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const message = await api<MessageDTO>(`/api/conversations/${conversationId}`, { body: { text: body } });
      appendMessages([message]);
      setText('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = async () => {
    if (!conversation) return;
    setMenuOpen(false);
    if (!confirm(`Block ${conversation.otherUser.name}? They won't be able to message you.`)) return;
    try {
      const result = await api<{ blocked: boolean }>(`/api/users/${conversation.otherUser.id}/block`, { method: 'POST' });
      toast.success(result.blocked ? 'User blocked' : 'User unblocked');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 mb-3">{error}</p>
        <Link href="/messages" className="text-community-600 font-semibold text-sm">Back to messages</Link>
      </div>
    );
  }

  if (!conversation) return <Spinner className="py-24" />;

  let lastDay = '';

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-8.5rem)] lg:h-[100dvh] lg:px-4 lg:py-4">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b lg:border lg:rounded-t-2xl border-gray-200">
        <Link href="/messages" className="p-1 -ml-1 text-gray-500 hover:text-gray-900" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link href={`/u/${conversation.otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={conversation.otherUser.name} image={conversation.otherUser.image} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{conversation.otherUser.name}</p>
            <p className="text-xs text-gray-500 truncate">@{conversation.otherUser.username}</p>
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100" aria-label="More">
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
              <button onClick={() => { setMenuOpen(false); setReporting(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Flag className="w-4 h-4" /> Report user
              </button>
              <button onClick={toggleBlock} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Ban className="w-4 h-4" /> Block / unblock
              </button>
            </div>
          )}
        </div>
      </div>

      {conversation.listing && (
        <Link href={`/marketplace/${conversation.listing.id}`} className="flex items-center gap-3 px-4 py-2 bg-marketplace-50 border-b lg:border-x border-marketplace-100">
          {conversation.listing.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(conversation.listing.image, 96)} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{conversation.listing.title}</p>
            <p className="text-xs text-marketplace-700">{formatPrice(conversation.listing.price, conversation.listing.currency)}</p>
          </div>
        </Link>
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 lg:border-x border-gray-200 px-4 py-4 space-y-1.5">
        {messages.map((m) => {
          const day = formatDay(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="text-center text-xs text-gray-400 my-3">{day}</p>}
              <div className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                    m.isMine ? 'bg-community-500 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn('text-[10px] mt-0.5 text-right', m.isMine ? 'text-white/70' : 'text-gray-400')}>{formatTime(m.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 px-3 py-3 bg-white border-t lg:border lg:rounded-b-2xl border-gray-200">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          className="input-field resize-none max-h-32 py-2"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-community-500 text-white disabled:opacity-50 hover:bg-community-600 flex-shrink-0"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {reporting && <ReportDialog open onClose={() => setReporting(false)} targetType="user" targetId={conversation.otherUser.id} />}
    </div>
  );
}
