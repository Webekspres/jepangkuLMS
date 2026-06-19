'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Reply, Send, ThumbsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  likeLessonComment,
  likeLessonCommentReply,
  postLessonComment,
  postLessonCommentReply,
  type LessonCommentReplyView,
  type LessonCommentView,
} from '@/features/learning/actions/lesson-qa-actions';
import {
  isMentionToken,
  mentionHandle,
  splitCommentWithMentions,
} from '@/features/learning/lib/lesson-qa-utils';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-primary',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function AvatarIcon({ initial, name, size = 'md' }: { initial: string; name: string; size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        avatarColor(name),
        size === 'sm' ? 'size-7 text-[11px]' : 'size-9 text-sm',
      )}
    >
      {initial}
    </div>
  );
}

function CommentContent({ content }: { content: string }) {
  const parts = splitCommentWithMentions(content);
  return (
    <p className="text-sm leading-relaxed text-foreground">
      {parts.map((part, index) =>
        isMentionToken(part) ? (
          <span key={index} className="font-semibold text-primary">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

type ReplyTarget = {
  commentId: string;
  author: string;
};

function ReplyForm({
  target,
  onCancel,
  onSuccess,
}: {
  target: ReplyTarget;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const mention = `@${mentionHandle(target.author)} `;
  const [draft, setDraft] = useState(mention);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const text = draft.trim();
    if (!text || text === mention.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await postLessonCommentReply(target.commentId, text, target.author);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSuccess();
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Balas <span className="font-semibold text-foreground">{target.author}</span>
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Batal balas"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Balas @${mentionHandle(target.author)}…`}
        className="min-h-[64px] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        rows={2}
        autoFocus
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Batal
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={isPending || draft.trim().length < 3}
          onClick={handleSubmit}
        >
          <Send className="size-3" />
          Kirim
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onLikeComment,
  onLikeReply,
  replyTarget,
  onReply,
  onCancelReply,
  onReplySuccess,
  depth = 0,
}: {
  comment: LessonCommentView | LessonCommentReplyView;
  onLikeComment: (id: string) => void;
  onLikeReply: (id: string) => void;
  replyTarget: ReplyTarget | null;
  onReply: (target: ReplyTarget) => void;
  onCancelReply: () => void;
  onReplySuccess: () => void;
  depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const isTopLevel = 'replies' in comment;
  const replies = isTopLevel ? comment.replies : undefined;
  const isReplyFormOpen = isTopLevel && replyTarget?.commentId === comment.id;

  function handleLike() {
    if (liked) return;
    setLiked(true);
    setLikeCount((n) => n + 1);
    if (isTopLevel) onLikeComment(comment.id);
    else onLikeReply(comment.id);
  }

  return (
    <div className={cn('flex gap-3', depth > 0 && 'mt-3 border-l-2 border-border pl-4')}>
      <AvatarIcon initial={comment.avatarInitial} name={comment.author} size={depth > 0 ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.author}</span>
          {'isInstructor' in comment && comment.isInstructor && (
            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold">
              Instruktur
            </Badge>
          )}
          {'isYou' in comment && comment.isYou && (
            <Badge className="h-5 rounded-full px-2 text-[10px] font-semibold">Kamu</Badge>
          )}
          <span className="text-xs text-muted-foreground">{comment.time}</span>
        </div>
        <CommentContent content={comment.content} />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-colors',
              liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ThumbsUp className={cn('size-3.5', liked && 'fill-current')} />
            {likeCount}
          </button>
          {isTopLevel ? (
            <button
              type="button"
              onClick={() => onReply({ commentId: comment.id, author: comment.author })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Reply className="size-3.5" />
              Balas
            </button>
          ) : null}
        </div>
        {isReplyFormOpen && replyTarget ? (
          <ReplyForm target={replyTarget} onCancel={onCancelReply} onSuccess={onReplySuccess} />
        ) : null}
        {replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            onLikeComment={onLikeComment}
            onLikeReply={onLikeReply}
            replyTarget={replyTarget}
            onReply={onReply}
            onCancelReply={onCancelReply}
            onReplySuccess={onReplySuccess}
            depth={1}
          />
        ))}
      </div>
    </div>
  );
}

type LessonQaSectionProps = {
  lessonId: string;
  lessonTitle: string;
  initialComments: LessonCommentView[];
};

export function LessonQaSection({ lessonId, lessonTitle, initialComments }: LessonQaSectionProps) {
  const router = useRouter();
  const comments = initialComments;
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const text = draft.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const result = await postLessonComment(lessonId, text);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDraft('');
      router.refresh();
    });
  }

  function handleLikeComment(commentId: string) {
    startTransition(async () => {
      await likeLessonComment(commentId);
    });
  }

  function handleLikeReply(replyId: string) {
    startTransition(async () => {
      await likeLessonCommentReply(replyId);
    });
  }

  function handleReplySuccess() {
    setReplyTarget(null);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" />
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">Tanya Jawab</h2>
          <p className="text-xs text-muted-foreground">Diskusi untuk &quot;{lessonTitle}&quot;</p>
        </div>
      </div>

      <div className="mb-4 space-y-4">
        {comments.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada pertanyaan. Jadilah yang pertama bertanya!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLikeComment={handleLikeComment}
              onLikeReply={handleLikeReply}
              replyTarget={replyTarget}
              onReply={setReplyTarget}
              onCancelReply={() => setReplyTarget(null)}
              onReplySuccess={handleReplySuccess}
            />
          ))
        )}
      </div>

      <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tulis pertanyaan atau komentar kamu… Gunakan @nama untuk mention."
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          rows={3}
        />
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <div className="mt-3 flex justify-end">
          <Button size="sm" className="gap-2" disabled={isPending || !draft.trim()} onClick={handleSubmit}>
            <Send className="size-3.5" />
            Kirim
          </Button>
        </div>
      </div>
    </section>
  );
}
