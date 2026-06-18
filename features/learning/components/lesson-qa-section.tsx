'use client';

/**
 * Lesson Q&A / Forum Section
 * Mockup UI — schema DB belum ada, semua state lokal.
 * Siap dihubungkan ke model LessonComment di Prisma setelah skema ditambahkan.
 */

import { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MockComment = {
  id: string;
  author: string;
  avatarInitial: string;
  avatarColor: string;
  content: string;
  time: string;
  likes: number;
  isInstructor?: boolean;
  replies?: Omit<MockComment, 'replies'>[];
};

const MOCK_COMMENTS: MockComment[] = [
  {
    id: '1',
    author: 'Budi Santoso',
    avatarInitial: 'B',
    avatarColor: 'bg-blue-500',
    content:
      'Sensei, untuk hiragana ぎ (gi) dan じ (ji) apakah ada cara mudah untuk membedakannya saat menulis? Saya sering tertukar.',
    time: '2 hari lalu',
    likes: 8,
    replies: [
      {
        id: '1-1',
        author: 'Sensei Tanaka',
        avatarInitial: 'T',
        avatarColor: 'bg-primary',
        content:
          'Bagus pertanyaannya! Perbedaan utama: ぎ memiliki dua titik di sisi kanan yang lebih ke bawah, sedangkan じ titiknya lebih ke tengah. Coba latih dengan menulisnya berpasangan 10× sehari selama seminggu!',
        time: '1 hari lalu',
        likes: 14,
        isInstructor: true,
      },
    ],
  },
  {
    id: '2',
    author: 'Dian Pratiwi',
    avatarInitial: 'D',
    avatarColor: 'bg-emerald-500',
    content: 'Video ini sangat membantu! Saya sekarang sudah hafal semua vokal dasar a, i, u, e, o. Terima kasih 🙏',
    time: '3 hari lalu',
    likes: 5,
    replies: [],
  },
  {
    id: '3',
    author: 'Rizky Ramadhan',
    avatarInitial: 'R',
    avatarColor: 'bg-amber-500',
    content:
      'Apakah ada rekomendasi app atau tools tambahan untuk melatih menulis hiragana selain flashcard di sini?',
    time: '5 hari lalu',
    likes: 3,
    replies: [
      {
        id: '3-1',
        author: 'Admin JepangKu',
        avatarInitial: 'A',
        avatarColor: 'bg-brand-red',
        content:
          'Hi Rizky! Kami rekomendasikan Anki (flashcard SRS), Jotoba (kamus), dan tentu saja terus latihan di platform ini. Fitur latihan menulis akan segera hadir di update berikutnya!',
        time: '4 hari lalu',
        likes: 7,
        isInstructor: true,
      },
    ],
  },
];

function AvatarIcon({
  initial,
  colorClass,
  size = 'md',
}: {
  initial: string;
  colorClass: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        colorClass,
        size === 'sm' ? 'size-7 text-[11px]' : 'size-9 text-sm',
      )}
    >
      {initial}
    </div>
  );
}

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: MockComment | Omit<MockComment, 'replies'>;
  depth?: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');

  const replies = 'replies' in comment ? comment.replies : undefined;

  function handleLike() {
    if (!liked) {
      setLiked(true);
      setLikeCount((n) => n + 1);
    } else {
      setLiked(false);
      setLikeCount((n) => n - 1);
    }
  }

  return (
    <div className={cn('flex gap-3', depth > 0 && 'mt-3 border-l-2 border-border pl-4')}>
      <AvatarIcon initial={comment.avatarInitial} colorClass={comment.avatarColor} size={depth > 0 ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.author}</span>
          {comment.isInstructor && (
            <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-semibold">
              Instruktur
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{comment.time}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{comment.content}</p>
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
          {depth === 0 && (
            <button
              type="button"
              onClick={() => setShowReplyBox((v) => !v)}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Balas
            </button>
          )}
        </div>

        {showReplyBox && (
          <div className="mt-3 flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis balasan..."
              className="min-h-[70px] text-sm"
              rows={2}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-8 px-3"
                disabled={!replyText.trim()}
                onClick={() => {
                  setReplyText('');
                  setShowReplyBox(false);
                }}
              >
                <Send className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={() => setShowReplyBox(false)}
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {replies && replies.length > 0 && (
          <div className="mt-3 space-y-0">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type LessonQaSectionProps = {
  lessonId: string;
  lessonTitle: string;
};

export function LessonQaSection({ lessonId: _lessonId, lessonTitle }: LessonQaSectionProps) {
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 sm:px-6"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="size-5 text-primary" />
          <span className="text-base font-bold text-foreground">Tanya Jawab & Diskusi</span>
          <Badge variant="secondary" className="rounded-full text-xs">
            {MOCK_COMMENTS.length}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* New question input */}
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Punya pertanyaan tentang{' '}
              <span className="text-foreground">{lessonTitle}</span>?
            </p>
            <div className="flex gap-3">
              <AvatarIcon initial="K" colorClass="bg-primary" />
              <div className="flex-1 space-y-2">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tulis pertanyaan atau komentar kamu di sini... (mockup — belum terhubung ke DB)"
                  className="min-h-[80px] resize-none text-sm"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    💡 Pertanyaan yang spesifik mendapat jawaban lebih cepat
                  </p>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={!question.trim()}
                    onClick={() => setQuestion('')}
                  >
                    <Send className="size-3.5" />
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comment list */}
          <div className="divide-y divide-border">
            {MOCK_COMMENTS.map((comment) => (
              <div key={comment.id} className="px-5 py-4 sm:px-6">
                <CommentItem comment={comment} />
              </div>
            ))}
          </div>

          {/* Load more placeholder */}
          <div className="border-t border-border px-5 py-4 text-center sm:px-6">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Lihat semua diskusi
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
