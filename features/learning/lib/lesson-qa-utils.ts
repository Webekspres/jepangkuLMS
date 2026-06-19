export function mentionHandle(name: string): string {
  return name.trim().replace(/\s+/g, '');
}

export function buildReplyWithMention(authorName: string, content: string): string {
  const trimmed = content.trim();
  const handle = mentionHandle(authorName);
  const mention = `@${handle}`;
  if (!handle) return trimmed;
  if (trimmed.toLowerCase().startsWith(mention.toLowerCase())) return trimmed;
  return `${mention} ${trimmed}`;
}

export const MENTION_PATTERN = /(@\S+)/g;

export function splitCommentWithMentions(content: string): string[] {
  return content.split(MENTION_PATTERN);
}

export function isMentionToken(part: string): boolean {
  return part.startsWith('@');
}
