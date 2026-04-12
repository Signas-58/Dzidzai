import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { embedText, embedLocal } from './embedding';
import { RagChunk, RagRetrievalResult, RagStoredChunk } from './types';

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

const storePath = path.join(process.cwd(), 'data', 'rag-store.json');

type PersistedStore = {
  version: 1;
  provider: 'openai' | 'local';
  dim?: number;
  chunks: RagStoredChunk[];
};

export class InMemoryVectorStore {
  private chunks: RagStoredChunk[] = [];
  private provider: 'openai' | 'local' = 'local';

  constructor() {
    this.loadFromDisk();
  }

  private ensureDataDir(): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(storePath)) return;
      const raw = fs.readFileSync(storePath, 'utf8');
      const parsed = JSON.parse(raw) as PersistedStore;
      if (parsed?.version === 1 && Array.isArray(parsed.chunks)) {
        this.chunks = parsed.chunks;
        this.provider = parsed.provider || 'local';
        logger.info('RAG store loaded', { count: this.chunks.length, provider: this.provider });
      }
    } catch (err) {
      logger.warn('Failed to load RAG store', { message: err instanceof Error ? err.message : String(err) });
    }
  }

  private saveToDisk(): void {
    this.ensureDataDir();
    const payload: PersistedStore = {
      version: 1,
      provider: this.provider,
      chunks: this.chunks,
    };
    fs.writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  async addChunks(chunks: Array<Omit<RagChunk, 'id'> & { id?: string }>): Promise<RagChunk[]> {
    const stored: RagStoredChunk[] = [];

    for (const c of chunks) {
      const id = c.id || uuidv4();
      const { embedding, provider } = await embedText(c.text);
      this.provider = provider;
      stored.push({ id, text: c.text, metadata: c.metadata, embedding });
    }

    this.chunks.push(...stored);
    this.saveToDisk();

    logger.info('RAG chunks ingested', { count: stored.length, total: this.chunks.length, provider: this.provider });

    return stored.map(({ embedding: _e, ...rest }) => rest);
  }

  retrieve(query: string, options?: { topK?: number; subject?: string; topic?: string }): RagRetrievalResult[] {
    if (this.chunks.length === 0) return [];

    const topK = options?.topK ?? 3;

    const q = embedLocal(query);
    const filtered = this.chunks.filter((c) => {
      if (options?.subject && c.metadata.subject !== options.subject) return false;
      if (options?.topic && c.metadata.topic && c.metadata.topic !== options.topic) return false;
      return true;
    });

    const scored = filtered.map((c) => {
      const score = cosineSimilarity(q, c.embedding);
      return {
        chunk: { id: c.id, text: c.text, metadata: c.metadata },
        score,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  clear(): void {
    this.chunks = [];
    this.saveToDisk();
  }
}

export const ragVectorStore = new InMemoryVectorStore();
