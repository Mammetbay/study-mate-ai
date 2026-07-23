import * as SQLite from 'expo-sqlite';
import { Note } from '../types';

export async function initDB() {
  const db = await SQLite.openDatabaseAsync('studymate.db');
  
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
  
  return db;
}

// Helpers can be added here later (e.g., insertNote, getNotes, etc.)
export async function insertNote(note: Note) {
  const db = await SQLite.openDatabaseAsync('studymate.db');
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

export async function getNotes(): Promise<Note[]> {
  const db = await SQLite.openDatabaseAsync('studymate.db');
  const result = await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY createdAt DESC');
  return result;
}

export async function getNoteById(id: string): Promise<Note | null> {
  const db = await SQLite.openDatabaseAsync('studymate.db');
  const result = await db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?', [id]);
  return result || null;
}
