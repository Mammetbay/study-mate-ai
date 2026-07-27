import * as SQLite from 'expo-sqlite';
import { Flashcard, Note, QuizQuestion } from '../types';

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      sourceType TEXT NOT NULL,
      audioUri TEXT,
      imageUri TEXT,
      transcript TEXT NOT NULL,
      summary TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      language TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY NOT NULL,
      noteId TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON stringified array
      correctIndex INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY NOT NULL,
      noteId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      lastReviewed TEXT
    );
  `);
}

export async function insertNote(db: SQLite.SQLiteDatabase, note: Note) {
  await db.runAsync(
    `INSERT INTO notes (id, title, sourceType, audioUri, imageUri, transcript, summary, createdAt, language) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      note.id,
      note.title,
      note.sourceType,
      note.audioUri || null,
      note.imageUri || null,
      note.transcript,
      note.summary,
      note.createdAt,
      note.language,
    ]
  );
}

export async function updateNoteSummary(
  db: SQLite.SQLiteDatabase,
  noteId: string,
  summary: string
) {
  await db.runAsync('UPDATE notes SET summary = ? WHERE id = ?', [summary, noteId]);
}

export async function getNotes(db: SQLite.SQLiteDatabase): Promise<Note[]> {
  const result = await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY createdAt DESC');
  return result;
}

export async function getNoteById(db: SQLite.SQLiteDatabase, id: string): Promise<Note | null> {
  const result = await db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
  return result || null;
}

// --- Quiz Helpers ---

export async function insertQuizQuestions(
  db: SQLite.SQLiteDatabase,
  questions: QuizQuestion[]
) {
  for (const q of questions) {
    await db.runAsync(
      `INSERT INTO quizzes (id, noteId, question, options, correctIndex)
       VALUES (?, ?, ?, ?, ?)`,
      [q.id, q.noteId, q.question, JSON.stringify(q.options), q.correctIndex]
    );
  }
}

export async function getQuizQuestionsByNoteId(
  db: SQLite.SQLiteDatabase,
  noteId: string
): Promise<QuizQuestion[]> {
  const rows = await db.getAllAsync<{
    id: string;
    noteId: string;
    question: string;
    options: string;
    correctIndex: number;
  }>('SELECT * FROM quizzes WHERE noteId = ?', [noteId]);
  return rows.map((row) => ({
    id: row.id,
    noteId: row.noteId,
    question: row.question,
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
    correctIndex: row.correctIndex,
  }));
}

export interface NoteWithQuizInfo {
  noteId: string;
  noteTitle: string;
  questionCount: number;
  createdAt: string;
}

export async function getNotesWithQuizzes(
  db: SQLite.SQLiteDatabase
): Promise<NoteWithQuizInfo[]> {
  const rows = await db.getAllAsync<{
    noteId: string;
    noteTitle: string;
    createdAt: string;
    questionCount: number;
  }>(
    `SELECT n.id as noteId, n.title as noteTitle, n.createdAt as createdAt, COUNT(q.id) as questionCount
     FROM notes n
     INNER JOIN quizzes q ON n.id = q.noteId
     GROUP BY n.id
     ORDER BY n.createdAt DESC`
  );
  return rows;
}

// --- Flashcard Helpers ---

export async function insertFlashcards(db: SQLite.SQLiteDatabase, cards: Flashcard[]) {
  for (const card of cards) {
    await db.runAsync(
      `INSERT INTO flashcards (id, noteId, front, back, lastReviewed)
       VALUES (?, ?, ?, ?, ?)`,
      [card.id, card.noteId, card.front, card.back, card.lastReviewed || null]
    );
  }
}

export async function getFlashcardsByNoteId(
  db: SQLite.SQLiteDatabase,
  noteId: string
): Promise<Flashcard[]> {
  const rows = await db.getAllAsync<{
    id: string;
    noteId: string;
    front: string;
    back: string;
    lastReviewed: string | null;
  }>('SELECT * FROM flashcards WHERE noteId = ?', [noteId]);

  return rows.map((row) => ({
    id: row.id,
    noteId: row.noteId,
    front: row.front,
    back: row.back,
    lastReviewed: row.lastReviewed ?? undefined,
  }));
}

export async function updateFlashcardReview(
  db: SQLite.SQLiteDatabase,
  flashcardId: string,
  lastReviewed: string
) {
  await db.runAsync('UPDATE flashcards SET lastReviewed = ? WHERE id = ?', [
    lastReviewed,
    flashcardId,
  ]);
}

