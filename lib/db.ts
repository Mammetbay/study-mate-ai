import * as SQLite from 'expo-sqlite';

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
