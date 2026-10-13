'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/client';
import type { PublicUser } from '@/types';

export default function NewMessageForm({ recipient }: { recipient: PublicUser }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const { conversationId } = await api<{ conversationId: string }>('/api/conversations', {
        body: { recipientId: recipient.id, text },
      });
      router.replace(`/messages/${conversationId}`);
    } catch (error) {
      toast.error((error as Error).message);
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-5 lg:py-8">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Messages
      </Link>
      <form onSubmit={send} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={recipient.name} image={recipient.image} size="lg" />
          <div>
            <p className="text-sm text-gray-500">New message to</p>
            <p className="font-semibold text-gray-900">{recipient.name}</p>
            <p className="text-xs text-gray-500">@{recipient.username}</p>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={2000}
          autoFocus
          placeholder="Say hello…"
          className="input-field resize-none"
        />
        <p className="text-xs text-gray-500">Be kind and respectful. Never share passwords, bank details or verification codes.</p>
        <Button type="submit" className="w-full" loading={sending} disabled={!text.trim()}>
          <Send className="w-4 h-4 mr-2" /> Send message
        </Button>
      </form>
    </div>
  );
}
