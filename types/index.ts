import { LanguageCode } from '../config/languages';

export interface Note {
  id: string;
  title: string;
  sourceType: 'audio' | 'image';
  audioUri?: string;
  imageUri?: string;
  transcript: string;
  summary: string;
  createdAt: string;
  language: LanguageCode;
  // AI-generated keywords (1-5) used for filtering. See generateNoteMetadata.
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  noteId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Flashcard {
  id: string;
  noteId: string;
  front: string;
  back: string;
  lastReviewed?: string;
  // Spaced repetition state (SM-2-lite). See lib/spacedRepetition.ts
  interval: number; // days until next review
  easeFactor: number; // difficulty multiplier (>= 1.3)
  repetitions: number; // consecutive successful reviews
  dueDate: string; // ISO date when the card is next due
}
