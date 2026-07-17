export function mentionHandle(name: string): string {
  return name.trim().replace(/\s+/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripReplyMention(authorName: string, content: string): string {
  const handle = mentionHandle(authorName);
  if (!handle) return content.trim();

  const mentionPattern = new RegExp(`(^|\\s)@${escapeRegExp(handle)}(?=\\s|$|[.,!?])`, 'gi');
  return content.replace(mentionPattern, ' ').replace(/\s+/g, ' ').trim();
}

export function buildReplyWithMention(authorName: string, content: string): string {
  const handle = mentionHandle(authorName);
  const mention = `@${handle}`;
  if (!handle) return content.trim();

  const body = stripReplyMention(authorName, content);
  return body ? `${mention} ${body}` : mention;
}

export const MENTION_PATTERN = /(@\S+)/g;

export function splitCommentWithMentions(content: string): string[] {
  return content.split(MENTION_PATTERN);
}

export function isMentionToken(part: string): boolean {
  return part.startsWith('@');
}

export type ReplyTreeNode<T extends { id: string; parentReplyId: string | null }> = T & {
  replies: ReplyTreeNode<T>[];
};

export function buildReplyTree<T extends { id: string; parentReplyId: string | null }>(
  replies: T[],
): ReplyTreeNode<T>[] {
  const nodeById = new Map<string, ReplyTreeNode<T>>();
  const roots: ReplyTreeNode<T>[] = [];

  for (const reply of replies) {
    nodeById.set(reply.id, { ...reply, replies: [] });
  }

  for (const reply of replies) {
    const node = nodeById.get(reply.id);
    if (!node) continue;

    const parent = reply.parentReplyId ? nodeById.get(reply.parentReplyId) : null;
    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
