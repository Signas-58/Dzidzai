import { AIGenerateResponse, SupportedLanguage, GradeLevel } from './types';

export class AIValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIValidationError';
  }
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function isNonEmptyString(s: unknown): s is string {
  return typeof s === 'string' && s.trim().length > 0;
}

function normalizeLanguage(lang: string): SupportedLanguage | null {
  const v = lang.trim().toLowerCase();
  if (v === 'shona') return 'Shona';
  if (v === 'ndebele') return 'Ndebele';
  if (v === 'tonga') return 'Tonga';
  if (v === 'english' || v === 'en') return 'English';
  return null;
}

export function parseJsonStrict(text: string): unknown {
  const raw = String(text ?? '').trim();
  const attemptParse = (candidate: string) => {
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  const direct = attemptParse(raw);
  if (direct !== null) return direct;

  const withoutFences = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const fenceParsed = attemptParse(withoutFences);
  if (fenceParsed !== null) return fenceParsed;

  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const extracted = withoutFences.slice(firstBrace, lastBrace + 1);
    const extractedParsed = attemptParse(extracted);
    if (extractedParsed !== null) return extractedParsed;
  }

  throw new AIValidationError('AI response is not valid JSON');
}

export function validateAIGenerateResponse(
  data: unknown,
  expected: { language: SupportedLanguage; gradeLevel: GradeLevel; minConfidence: number }
): AIGenerateResponse {
  if (!data || typeof data !== 'object') {
    throw new AIValidationError('AI response must be a JSON object');
  }

  const obj = data as Record<string, unknown>;

  if (!isNonEmptyString(obj.explanation)) throw new AIValidationError('Missing explanation');
  if (!isNonEmptyString(obj.example)) throw new AIValidationError('Missing example');

  if (!Array.isArray(obj.practice_questions)) {
    throw new AIValidationError('practice_questions must be an array');
  }

  const practice_questions = obj.practice_questions.map((q) => {
    if (!q || typeof q !== 'object') throw new AIValidationError('Each practice question must be an object');
    const qq = q as Record<string, unknown>;
    if (!isNonEmptyString(qq.question)) throw new AIValidationError('practice_questions.question missing');
    if (!isNonEmptyString(qq.hint)) throw new AIValidationError('practice_questions.hint missing');
    if (!isNonEmptyString(qq.answer)) throw new AIValidationError('practice_questions.answer missing');
    return {
      question: String(qq.question),
      hint: String(qq.hint),
      answer: String(qq.answer),
    };
  });

  const normalizedQuestions = practice_questions.map((q) => {
    const raw = q.question.trim().toLowerCase();
    // Remove leading numbering like "1." or "1)" or "q1:" to catch duplicates with cosmetic differences
    const withoutLeadingNumber = raw.replace(/^\s*(q\s*)?\d+\s*[\)\.:\-]+\s*/i, '');
    // Normalize punctuation/quotes/extra whitespace so minor formatting differences don't bypass duplicate detection
    return withoutLeadingNumber
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  });
  const uniqueCount = new Set(normalizedQuestions).size;
  if (uniqueCount !== normalizedQuestions.length) {
    throw new AIValidationError('Duplicate practice questions');
  }

  const langRaw = obj.language;
  if (!isNonEmptyString(langRaw)) throw new AIValidationError('Missing language');
  const normalized = normalizeLanguage(langRaw);
  if (!normalized) throw new AIValidationError('Unsupported language value');
  if (normalized !== expected.language) throw new AIValidationError('Language mismatch');

  const gradeRaw = obj.gradeLevel;
  if (!isNonEmptyString(gradeRaw)) throw new AIValidationError('Missing gradeLevel');
  if (gradeRaw !== expected.gradeLevel) throw new AIValidationError('gradeLevel mismatch');

  const conf = obj.confidenceScore;
  if (!isFiniteNumber(conf)) throw new AIValidationError('confidenceScore must be a number');
  if (conf < 0 || conf > 1) throw new AIValidationError('confidenceScore must be between 0 and 1');
  if (conf < expected.minConfidence) throw new AIValidationError('Low confidence response');

  const combinedText = `${String(obj.explanation)} ${String(obj.example)} ${practice_questions
    .map((q) => `${q.question} ${q.hint} ${q.answer}`)
    .join(' ')}`.toLowerCase();
  const englishStopwords = [' the ', ' and ', ' is ', ' are ', ' of ', ' to ', ' in ', ' for ', ' with '];
  const englishHits = englishStopwords.reduce((acc, w) => acc + (combinedText.includes(w) ? 1 : 0), 0);
  if (expected.language !== 'English' && englishHits >= 4) {
    throw new AIValidationError('Language consistency check failed');
  }

  return {
    explanation: String(obj.explanation),
    example: String(obj.example),
    practice_questions,
    language: expected.language,
    gradeLevel: expected.gradeLevel,
    confidenceScore: conf,
  };
}
