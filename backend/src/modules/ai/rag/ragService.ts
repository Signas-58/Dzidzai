import { logger } from '../../../utils/logger';
import { AIGenerateRequest } from '../types';
import { ragVectorStore } from './vectorStore';

export class RAGService {
  static retrieveForGeneration(input: AIGenerateRequest): {
    used: boolean;
    contextText: string;
    results: Array<{ id: string; score: number; subject: string; topic?: string; source: string }>;
  } {
    const query = `${input.subject} ${input.topic} ${input.gradeLevel} ${input.language}`;

    const results = ragVectorStore.retrieve(query, {
      topK: 3,
      subject: input.subject,
      topic: input.topic,
    });

    if (results.length === 0) {
      logger.info('RAG retrieve', { used: false, results: 0 });
      return { used: false, contextText: '', results: [] };
    }

    const contextText = results
      .map((r, idx) => `[#${idx + 1} score=${r.score.toFixed(3)} source=${r.chunk.metadata.source}]\n${r.chunk.text}`)
      .join('\n\n---\n\n');

    const logResults = results.map((r) => ({
      id: r.chunk.id,
      score: r.score,
      subject: r.chunk.metadata.subject,
      topic: r.chunk.metadata.topic,
      source: r.chunk.metadata.source,
    }));

    logger.info('RAG retrieve', { used: true, results: logResults });

    return {
      used: true,
      contextText,
      results: logResults,
    };
  }
}
