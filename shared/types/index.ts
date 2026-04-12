// Shared types used across frontend and backend

export enum UserRole {
  PARENT = 'parent',
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export enum Language {
  ENGLISH = 'en',
  SHONA = 'sn',
  NDEBELE = 'nd',
  TONGA = 'tn'
}

export enum ExerciseType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank',
  MATCHING = 'matching'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  languagePreference: Language;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  languagePreference: Language;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  language: Language;
  gradeLevel: number;
  subject: string;
  content: LessonContent;
  isAIGenerated: boolean;
  isValidated: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface LessonContent {
  objectives: string[];
  explanation: string;
  examples: string[];
  keyPoints: string[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  language: Language;
  difficulty: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  score?: number;
  timeSpent: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface LearningEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export interface AIGenerateRequest {
  type: 'lesson' | 'exercise';
  language: Language;
  gradeLevel: number;
  subject: string;
  topic?: string;
  difficulty?: number;
}

export interface AnalyticsData {
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
  timeSpent: number;
  progressBySubject: Record<string, number>;
  weeklyActivity: number[];
}
