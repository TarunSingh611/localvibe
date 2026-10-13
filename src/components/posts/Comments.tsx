'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Send, Trash2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/client';
import { formatRelativeTime } from '@/lib/utils';
import type { CommentDTO } from '@/types';

interface CommentsProps {
  postId: string;
  isPostOwner: boolean;
  onCountChange: (delta: number) => void;
}

export function Comments({ postId, isPostOwner, onCountChange }: CommentsProps) {
  const { data: session } = useSession();
  const requireAuth = useRequireAuth();
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: CommentDTO[] }>(`/api/posts/${postId}/comments`)
      .then((data) => setComments(data.items))
      .catch(() => setComments([]));
  }, [postId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAuth() || !text.trim()) return;
    setSending(true);
    try {
      const comment = await api<CommentDTO>(`/api/posts/${postId}/comments`, { body: { text } });
      setComments((prev) => [...(prev ?? []), comment]);
      setText('');
      onCountChange(1);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api(`/api/comments/${id}`, { method: 'DELETE' });
      setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
      onCountChange(-1);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-3 mt-3 space-y-3">
      {comments === null ? (
        <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5 group">
              <Link href={`/u/${comment.author.username}`}>
                <Avatar name={comment.author.name} image={comment.author.image} size="sm" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/u/${comment.author.username}`} className="text-sm font-semibold text-gray-900 hover:underline">
                      {comment.author.name}
                    </Link>
                    <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
              </div>
              <div className="flex flex-col opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {(comment.isOwner || isPostOwner || session?.user.role === 'admin') && (
                  <button onClick={() => remove(comment.id)} className="p-1.5 text-gray-400 hover:text-red-500" aria-label="Delete comment">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!comment.isOwner && session && (
                  <button onClick={() => setReporting(comment.id)} className="p-1.5 text-gray-400 hover:text-orange-500" aria-label="Report comment">
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <Avatar name={session?.user.name} image={session?.user.image} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => requireAuth()}
          maxLength={1000}
          placeholder={session ? 'Write a comment…' : 'Sign in to comment'}
          className="input-field rounded-full"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="p-2 rounded-full bg-community-500 text-white disabled:opacity-40"
          aria-label="Send comment"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {reporting && <ReportDialog open onClose={() => setReporting(null)} targetType="comment" targetId={reporting} />}
    </div>
  );
}
