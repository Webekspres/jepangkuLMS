'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Reply, Send, ThumbsUp, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  deleteLessonComment,
  deleteLessonCommentReply,
  likeLessonComment,
  likeLessonCommentReply,
  postLessonComment,
  postLessonCommentReply,
  type LessonCommentReplyView,
  type LessonCommentView,
} from '@/features/learning/actions/lesson-qa-actions';
import {
  isMentionToken,
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
  rootCommentId: string;
  parentReplyId?: string | null;
  targetId: string;
  author: string;
};

type DeleteTarget = {
  id: string;
  type: 'comment' | 'reply';
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
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const text = draft.trim();
    if (text.length < 3) return;
    setError(null);
    startTransition(async () => {
      const result = await postLessonCommentReply(target.rootCommentId, text, {
        replyToAuthor: target.author,
        parentReplyId: target.parentReplyId ?? null,
      });
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
        placeholder="Tulis balasan kamu…"
        className="min-h-[64px] rounded-sm border-border bg-background text-sm"
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
  rootCommentId,
  onLikeComment,
  onLikeReply,
  replyTarget,
  onReply,
  onDelete,
  onCancelReply,
  onReplySuccess,
  depth = 0,
}: {
  comment: LessonCommentView | LessonCommentReplyView;
  rootCommentId?: string;
  onLikeComment: (id: string) => void;
  onLikeReply: (id: string) => void;
  replyTarget: ReplyTarget | null;
  onReply: (target: ReplyTarget) => void;
  onDelete: (target: DeleteTarget) => void;
  onCancelReply: () => void;
  onReplySuccess: () => void;
  depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const isReply = depth > 0;
  const currentRootCommentId = rootCommentId ?? comment.id;
  const isReplyFormOpen = replyTarget?.targetId === comment.id;
  const indentDepth = Math.min(depth, 3);

  function handleLike() {
    if (liked) return;
    setLiked(true);
    setLikeCount((n) => n + 1);
    if (isReply) onLikeReply(comment.id);
    else onLikeComment(comment.id);
  }

  return (
    <div
      className={cn('flex gap-3', depth > 0 && 'mt-3 border-l-2 border-border')}
      style={depth > 0 ? { paddingLeft: `${indentDepth}rem` } : undefined}
    >
      <AvatarIcon initial={comment.avatarInitial} name={comment.author} size={depth > 0 ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.author}</span>
          {comment.isInstructor ? (
            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold">
              Instruktur
            </Badge>
          ) : null}
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
          <button
            type="button"
            onClick={() =>
              onReply({
                rootCommentId: currentRootCommentId,
                parentReplyId: isReply ? comment.id : null,
                targetId: comment.id,
                author: comment.author,
              })
            }
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Reply className="size-3.5" />
            Balas
          </button>
          {comment.canDelete ? (
            <button
              type="button"
              onClick={() => onDelete({ id: comment.id, type: isReply ? 'reply' : 'comment' })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Hapus
            </button>
          ) : null}
        </div>
        {isReplyFormOpen && replyTarget ? (
          <ReplyForm target={replyTarget} onCancel={onCancelReply} onSuccess={onReplySuccess} />
        ) : null}
        {comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            rootCommentId={currentRootCommentId}
            onLikeComment={onLikeComment}
            onLikeReply={onLikeReply}
            replyTarget={replyTarget}
            onReply={onReply}
            onDelete={onDelete}
            onCancelReply={onCancelReply}
            onReplySuccess={onReplySuccess}
            depth={depth + 1}
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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const result =
        deleteTarget.type === 'comment'
          ? await deleteLessonComment(deleteTarget.id)
          : await deleteLessonCommentReply(deleteTarget.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setDeleteTarget(null);
      setReplyTarget(null);
      router.refresh();
    });
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
              onDelete={setDeleteTarget}
              onCancelReply={() => setReplyTarget(null)}
              onReplySuccess={handleReplySuccess}
            />
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tulis pertanyaan atau komentar kamu…."
          className="min-h-[80px] rounded-sm border-border bg-background"
          rows={3}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex justify-end">
          <Button size="sm" className="gap-2" disabled={isPending || !draft.trim()} onClick={handleSubmit}>
            <Send className="size-3.5" />
            Kirim
          </Button>
        </div>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader className="gap-2 pr-10 text-left">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Hapus {deleteTarget?.type === 'reply' ? 'balasan' : 'komentar'}?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Aksi ini akan menghapus konten dan seluruh balasan di bawahnya.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              className="border border-destructive/20 bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
