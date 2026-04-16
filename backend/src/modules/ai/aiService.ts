import { openaiClient } from '../../config/openai';
import { logger } from '../../utils/logger';
import { PromptBuilder } from './promptBuilder';
import { AIGenerateRequest, AIGenerateResponse } from './types';
import { parseJsonStrict, validateAIGenerateResponse } from './validators';
import { RAGService } from './rag/ragService';
import { generateMock } from './mockGenerator';

export class AIService {
  static async generateStructuredContent(input: AIGenerateRequest): Promise<AIGenerateResponse> {
    const rag = RAGService.retrieveForGeneration(input);

    const expectedLanguage = input.mode === 'translate' && input.translateTo ? input.translateTo : input.language;

    if (String(process.env.AI_USE_MOCK || '').toLowerCase() === 'true') {
      const mocked = generateMock(input, rag.contextText || undefined);
      return validateAIGenerateResponse(mocked, {
        language: expectedLanguage,
        gradeLevel: input.gradeLevel,
        minConfidence: Number(process.env.AI_MIN_CONFIDENCE || '0.6'),
      });
    }

    const { system, user, fewShot } = PromptBuilder.buildGeneratePrompt(input, {
      contextText: rag.used ? rag.contextText : undefined,
    });

    const promptForLog = {
      system,
      fewShotCount: fewShot.length,
      user,
    };

    logger.info('AI generate prompt', promptForLog);

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const messages = [
      { role: 'system' as const, content: system },
      ...fewShot,
      { role: 'user' as const, content: user },
    ];

    let content = '';
    try {
      content = await openaiClient.generateChatContent(messages, {
        model,
        temperature: 0.3,
        maxTokens: 1200,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit');
      if (isQuota) {
        logger.warn('AI provider unavailable (quota/rate-limit). Using mock fallback.', { message: msg });
        const mocked = generateMock(input, rag.contextText || undefined);
        return validateAIGenerateResponse(mocked, {
          language: expectedLanguage,
          gradeLevel: input.gradeLevel,
          minConfidence: Number(process.env.AI_MIN_CONFIDENCE || '0.6'),
        });
      }
      throw err;
    }

    logger.info('AI raw response', { length: content.length });

    const parsed = parseJsonStrict(content);

    const validated = validateAIGenerateResponse(parsed, {
      language: expectedLanguage,
      gradeLevel: input.gradeLevel,
      minConfidence: Number(process.env.AI_MIN_CONFIDENCE || '0.6'),
    });

    logger.info('AI validated response', { confidenceScore: validated.confidenceScore });

    return validated;
  }
}
