import { openaiClient } from '../../config/openai';
import { logger } from '../../utils/logger';
import { PromptBuilder } from './promptBuilder';
import { AIGenerateRequest, AIGenerateResponse } from './types';
import { parseJsonStrict, validateAIGenerateResponse } from './validators';

export class AIService {
  static async generateStructuredContent(input: AIGenerateRequest): Promise<AIGenerateResponse> {
    const { system, user, fewShot } = PromptBuilder.buildGeneratePrompt(input);

    const promptForLog = {
      system,
      fewShotCount: fewShot.length,
      user,
    };

    logger.info('AI generate prompt', promptForLog);

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    const messages = [
      { role: 'system' as const, content: system },
      ...fewShot,
      { role: 'user' as const, content: user },
    ];

    const content = await openaiClient.generateChatContent(messages, {
      model,
      temperature: 0.3,
      maxTokens: 1200,
    });

    logger.info('AI raw response', { length: content.length });

    const parsed = parseJsonStrict(content);

    const validated = validateAIGenerateResponse(parsed, {
      language: input.language,
      gradeLevel: input.gradeLevel,
      minConfidence: Number(process.env.AI_MIN_CONFIDENCE || '0.6'),
    });

    logger.info('AI validated response', { confidenceScore: validated.confidenceScore });

    return validated;
  }
}
