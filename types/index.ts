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
}
