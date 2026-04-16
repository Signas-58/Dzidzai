export type Subject = 'Math' | 'English' | 'Science' | 'Social Studies';
export type SupportedLanguage = 'Shona' | 'Ndebele' | 'Tonga' | 'English';
export type GradeLevel = 'ECD A' | 'ECD B' | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7';

export interface AIGenerateRequest {
  subject: Subject;
  topic: string;
  gradeLevel: GradeLevel;
  language: SupportedLanguage;
  childId?: string;
  improve?: boolean;
  mode?: 'normal' | 'simplify' | 'translate';
  translateTo?: SupportedLanguage;
}

export interface RagIngestRequest {
  subject: Subject;
  topic?: string;
}

export interface AIPracticeQuestion {
  question: string;
  hint: string;
  answer: string;
}

export interface AIGenerateResponse {
  explanation: string;
  example: string;
  practice_questions: AIPracticeQuestion[];
  language: SupportedLanguage;
  gradeLevel: GradeLevel;
  confidenceScore: number;
}
