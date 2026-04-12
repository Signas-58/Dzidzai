export function chunkTextByWords(text: string, options?: {
  minWords?: number;
  maxWords?: number;
  overlapWords?: number;
}): string[] {
  const minWords = options?.minWords ?? 200;
  const maxWords = options?.maxWords ?? 500;
  const overlapWords = options?.overlapWords ?? 40;

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .trim();

  if (!cleaned) return [];

  const words = cleaned.split(/\s+/g);
  if (words.length <= maxWords) return [cleaned];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const slice = words.slice(start, end).join(' ').trim();

    if (slice.split(/\s+/g).length >= minWords || end === words.length) {
      chunks.push(slice);
    }

    if (end === words.length) break;

    start = Math.max(0, end - overlapWords);
  }

  return chunks;
}
