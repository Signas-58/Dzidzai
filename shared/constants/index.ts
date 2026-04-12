// Shared constants used across the application

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sn', name: 'Shona', nativeName: 'ChiShona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'tn', name: 'Tonga', nativeName: 'ChiTonga' }
] as const;

export const GRADE_LEVELS = [
  { value: 0, label: 'ECD A' },
  { value: 1, label: 'ECD B' },
  { value: 2, label: 'Grade 1' },
  { value: 3, label: 'Grade 2' },
  { value: 4, label: 'Grade 3' },
  { value: 5, label: 'Grade 4' },
  { value: 6, label: 'Grade 5' },
  { value: 7, label: 'Grade 6' },
  { value: 8, label: 'Grade 7' }
] as const;

export const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'shona', label: 'Shona' },
  { value: 'ndebele', label: 'Ndebele' },
  { value: 'tonga', label: 'Tonga' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'agriculture', label: 'Agriculture' }
] as const;

export const EXERCISE_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'matching', label: 'Matching' }
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Very Easy', color: 'green' },
  { value: 2, label: 'Easy', color: 'blue' },
  { value: 3, label: 'Medium', color: 'yellow' },
  { value: 4, label: 'Hard', color: 'orange' },
  { value: 5, label: 'Very Hard', color: 'red' }
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    CHILDREN: '/api/users/children',
    STUDENTS: '/api/users/students'
  },
  AI: {
    GENERATE_LESSON: '/api/ai/generate-lesson',
    GENERATE_EXERCISE: '/api/ai/generate-exercise',
    VALIDATE_CONTENT: '/api/ai/validate-content',
    TRANSLATE_CONTENT: '/api/ai/translate-content',
    SUPPORTED_LANGUAGES: '/api/ai/supported-languages'
  },
  CONTENT: {
    LESSONS: '/api/content/lessons',
    EXERCISES: '/api/content/exercises',
    PROGRESS: '/api/content/progress',
    CURRICULUM: '/api/content/curriculum',
    OFFLINE_SYNC: '/api/content/offline-sync'
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    PROGRESS: '/api/analytics/progress',
    REPORTS: '/api/analytics/reports',
    EVENTS: '/api/analytics/events',
    USAGE_STATS: '/api/analytics/usage-stats'
  }
} as const;

export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  LESSON_CONTENT: (lessonId: string) => `lesson:content:${lessonId}`,
  EXERCISES: (lessonId: string) => `exercises:${lessonId}`,
  USER_PROGRESS: (userId: string) => `progress:${userId}`,
  CURRICULUM: (grade: number, subject: string) => `curriculum:${grade}:${subject}`
} as const;

export const EVENT_TYPES = {
  LESSON_STARTED: 'lesson_started',
  LESSON_COMPLETED: 'lesson_completed',
  EXERCISE_ATTEMPTED: 'exercise_attempted',
  EXERCISE_COMPLETED: 'exercise_completed',
  CONTENT_VIEWED: 'content_viewed',
  LOGIN: 'login',
  LOGOUT: 'logout'
} as const;
