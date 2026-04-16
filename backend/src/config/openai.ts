import OpenAI from 'openai';
import { logger } from '../utils/logger';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

class OpenAIClient {
  private client: OpenAI | null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
        })
      : null;
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
    return this.client;
  }

  async embed(text: string, options?: { model?: string }): Promise<number[]> {
    const client = this.ensureClient();
    const model =
      options?.model ||
      process.env.GROQ_EMBEDDING_MODEL ||
      process.env.OPENAI_EMBEDDING_MODEL ||
      'text-embedding-3-small';
    const res = await client.embeddings.create({
      model,
      input: text,
    });
    const vec = res.data?.[0]?.embedding;
    if (!vec) {
      throw new Error('No embedding returned from provider');
    }
    return vec;
  }

  async generateContent(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      const client = this.ensureClient();
      const response = await client.chat.completions.create({
        model: options?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator for indigenous languages in Zimbabwe. Create curriculum-aligned, age-appropriate content in Shona, Ndebele, or Tonga.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('AI provider API error', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      throw new Error(`Failed to generate content using AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateChatContent(messages: ChatMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<string> {
    try {
      const client = this.ensureClient();
      const response = await client.chat.completions.create({
        model: options?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('AI provider chat API error', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      throw new Error(`Failed to generate chat content using AI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateContent(content: string, language: string): Promise<{
    isValid: boolean;
    score: number;
    feedback: string;
  }> {
    try {
      const validationPrompt = `
        Validate this educational content for ${language} language learning:
        
        Content: "${content}"
        
        Check for:
        1. Language accuracy and grammar
        2. Age-appropriateness for primary students
        3. Curriculum alignment
        4. Cultural appropriateness
        
        Respond with JSON format:
        {
          "isValid": boolean,
          "score": number (0-100),
          "feedback": "detailed feedback"
        }
      `;

      const client = this.ensureClient();
      const response = await client.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a content validator for educational materials. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: validationPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content;
      
      if (result) {
        try {
          return JSON.parse(result);
        } catch (parseError) {
          logger.error('Failed to parse AI validation response:', parseError);
          return {
            isValid: false,
            score: 0,
            feedback: 'Validation failed due to parsing error',
          };
        }
      }

      return {
        isValid: false,
        score: 0,
        feedback: 'No validation response received',
      };
    } catch (error) {
      logger.error('Content validation error:', error);
      throw new Error('Failed to validate content');
    }
  }

  async translateContent(content: string, targetLanguage: string): Promise<string> {
    try {
      const translationPrompt = `
        Translate this educational content to ${targetLanguage}:
        
        "${content}"
        
        Ensure the translation is:
        - Culturally appropriate
        - Educationally accurate
        - Age-appropriate for primary students
        - Maintains the original educational intent
        
        Provide only the translated content without additional explanations.
      `;

      const client = this.ensureClient();
      const response = await client.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert translator for educational content in Zimbabwean languages.',
          },
          {
            role: 'user',
            content: translationPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      logger.error('Translation error:', error);
      throw new Error('Failed to translate content');
    }
  }
}

export const openaiClient = new OpenAIClient();
