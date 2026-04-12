import { Subject } from '../types';

export interface RagChunkMetadata {
  subject: Subject;
  topic?: string;
  source: string;
  filename?: string;
  page?: number;
}

export interface RagChunk {
  id: string;
  text: string;
  metadata: RagChunkMetadata;
}

export interface RagStoredChunk extends RagChunk {
  embedding: number[];
}

export interface RagRetrievalResult {
  chunk: RagChunk;
  score: number;
}
