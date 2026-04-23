import { openaiClient } from '../../config/openai';
import { logger } from '../../utils/logger';
import { PromptBuilder } from './promptBuilder';
import { AIGenerateRequest, AIGenerateResponse } from './types';
import { AIValidationError, parseJsonStrict, validateAIGenerateResponse } from './validators';
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

    const validateOrThrow = (rawText: string) => {
      logger.info('AI raw response', { length: rawText.length });
      try {
        const parsed = parseJsonStrict(rawText);
        return validateAIGenerateResponse(parsed, {
          language: expectedLanguage,
          gradeLevel: input.gradeLevel,
          minConfidence: Number(process.env.AI_MIN_CONFIDENCE || '0.6'),
        });
      } catch (e) {
        if (e instanceof AIValidationError && e.message.toLowerCase().includes('not valid json')) {
          logger.warn('AI returned non-JSON response (snippet)', {
            snippet: String(rawText).slice(0, 400),
          });
        }
        throw e;
      }
    };

    const callModel = async (
      msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      opts?: { temperature?: number }
    ) => {
      return await openaiClient.generateChatContent(msgs, {
        model,
        temperature: opts?.temperature ?? 0.3,
        maxTokens: 1200,
      });
    };

    try {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const isRetry = attempt > 1;
        const retryInstruction = isRetry
          ?
              'Regenerate the FULL response. STRICT: Return ONLY valid JSON for the schema. No markdown, no code fences, no commentary. practice_questions must contain 3–5 questions; each one must test a different skill (definition/recall, understanding/explanation, application/word problem); use different numbers/examples/contexts; do not reuse the same sentence structure; no two questions may be meaningfully equivalent.'
          : null;

        const attemptMessages = retryInstruction
          ? [
              ...messages,
              {
                role: 'user' as const,
                content: retryInstruction,
              },
            ]
          : messages;

        const temperature = isRetry ? 0.7 : 0.3;
        const content = await callModel(attemptMessages, { temperature });
        try {
          const validated = validateOrThrow(content);
          logger.info(isRetry ? 'AI validated response (retry)' : 'AI validated response', {
            confidenceScore: validated.confidenceScore,
            attempt,
          });
          return validated;
        } catch (innerErr) {
          if (
            innerErr instanceof AIValidationError &&
            innerErr.message.toLowerCase().includes('duplicate practice questions') &&
            attempt < maxAttempts
          ) {
            logger.warn('AI produced duplicate practice questions. Retrying.', {
              subject: input.subject,
              topic: input.topic,
              attempt,
              maxAttempts,
            });
            continue;
          }

          if (
            innerErr instanceof AIValidationError &&
            innerErr.message.toLowerCase().includes('not valid json') &&
            attempt < maxAttempts
          ) {
            logger.warn('AI returned non-JSON. Retrying.', {
              subject: input.subject,
              topic: input.topic,
              attempt,
              maxAttempts,
            });
            continue;
          }
          throw innerErr;
        }
      }

      throw new Error('AI generation failed after retries');
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
  }
}
