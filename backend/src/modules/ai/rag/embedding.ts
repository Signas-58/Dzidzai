import { openaiClient } from '../../../config/openai';

const DEFAULT_DIM = 256;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/g)
    .filter(Boolean);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedLocal(text: string, dim = DEFAULT_DIM): number[] {
  const vec = new Array<number>(dim).fill(0);
  const tokens = tokenize(text);
  for (const t of tokens) {
    const idx = hashString(t) % dim;
    vec[idx] += 1;
  }

  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<{ embedding: number[]; provider: 'openai' | 'local' }> {
  const useOpenAI = String(process.env.RAG_USE_OPENAI_EMBEDDINGS || '').toLowerCase() === 'true';

  if (!useOpenAI) {
    return { embedding: embedLocal(text), provider: 'local' };
  }

  try {
    const embedding = await openaiClient.embed(text);
    return { embedding, provider: 'openai' };
  } catch {
    return { embedding: embedLocal(text), provider: 'local' };
  }
}
