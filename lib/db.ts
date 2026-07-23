import * as SQLite from 'expo-sqlite';
import { Note } from '../types';

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

// Helpers can be added here later (e.g., insertNote, getNotes, etc.)
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

export async function getNotes(db: SQLite.SQLiteDatabase): Promise<Note[]> {
  const result = await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY createdAt DESC');
  return result;
}

export async function getNoteById(db: SQLite.SQLiteDatabase, id: string): Promise<Note | null> {
  const result = await db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
  return result || null;
}
