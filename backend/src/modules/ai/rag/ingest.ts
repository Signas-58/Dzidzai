import fs from 'fs';
import path from 'path';
import { Subject } from '../types';
import { chunkTextByWords } from './chunker';
import { ragVectorStore } from './vectorStore';
import { RagChunkMetadata } from './types';

function extnameLower(filename: string): string {
  return path.extname(filename || '').toLowerCase();
}

async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = extnameLower(filePath);
  const buf = fs.readFileSync(filePath);

  if (ext === '.txt' || ext === '.md' || ext === '.csv') {
    return buf.toString('utf8');
  }

  if (ext === '.pdf') {
    let pdfParse: any;
    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch {
      throw new Error('PDF ingestion requires pdf-parse dependency');
    }

    const res = await pdfParse(buf);
    return String(res?.text || '');
  }

  return buf.toString('utf8');
}

export class RagIngestionService {
  static async ingestFile(params: {
    filePath: string;
    subject: Subject;
    topic?: string;
    source?: string;
    filename?: string;
  }): Promise<{ chunksIngested: number }> {
    const text = await extractTextFromFile(params.filePath);

    const chunks = chunkTextByWords(text, { minWords: 200, maxWords: 500, overlapWords: 40 });

    const metadataBase: RagChunkMetadata = {
      subject: params.subject,
      topic: params.topic,
      source: params.source || 'upload',
      filename: params.filename || path.basename(params.filePath),
    };

    const toStore = chunks.map((c) => ({
      text: c,
      metadata: metadataBase,
    }));

    await ragVectorStore.addChunks(toStore);

    return { chunksIngested: toStore.length };
  }
}
