import * as SQLite from 'expo-sqlite';
import { Flashcard, Note, QuizQuestion } from '../types';

const DATABASE_VERSION = 4;

/** Raw notes row as stored in SQLite (tags is a JSON-encoded string). */
interface NoteRow {
  id: string;
  title: string;
  sourceType: 'audio' | 'image';
  audioUri: string | null;
  imageUri: string | null;
  transcript: string;
  summary: string;
  createdAt: string;
  language: Note['language'];
  tags: string | null;
}

/** Maps a raw SQLite row to a Note, decoding the JSON tags column. */
function mapNoteRow(row: NoteRow): Note {
  let tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === 'string');
      }
    } catch {
      tags = [];
    }
  }
  return {
    id: row.id,
    title: row.title,
    sourceType: row.sourceType,
    audioUri: row.audioUri ?? undefined,
    imageUri: row.imageUri ?? undefined,
    transcript: row.transcript,
    summary: row.summary,
    createdAt: row.createdAt,
    language: row.language,
    tags,
  };
}

/**
 * Adds a column to a table only if it does not already exist. Keeps the
 * migration idempotent so it is safe to run against both fresh installs (where
 * the column is already part of CREATE TABLE) and older databases.
 */
async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Drops a column only if it exists. Idempotent, safe on fresh installs. */
async function dropColumnIfExists(db: SQLite.SQLiteDatabase, table: string, column: string) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  }
}

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  // Base schema — fresh installs get every column; existing tables are no-ops.
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
      language TEXT NOT NULL,
      tags TEXT
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
      lastReviewed TEXT,
      interval INTEGER NOT NULL DEFAULT 0,
      easeFactor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      dueDate TEXT
    );
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  // v2: spaced-repetition columns for older flashcard tables.
  await addColumnIfMissing(db, 'flashcards', 'interval', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'flashcards', 'easeFactor', 'REAL NOT NULL DEFAULT 2.5');
  await addColumnIfMissing(db, 'flashcards', 'repetitions', 'INTEGER NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'flashcards', 'dueDate', 'TEXT');

  // v3: AI-generated keyword tags (JSON array).
  await addColumnIfMissing(db, 'notes', 'tags', 'TEXT');

  // v4: drop the deprecated manual category column (replaced by tags).
  await dropColumnIfExists(db, 'notes', 'category');

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function insertNote(db: SQLite.SQLiteDatabase, note: Note) {
  await db.runAsync(
    `INSERT INTO notes (id, title, sourceType, audioUri, imageUri, transcript, summary, createdAt, language, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      JSON.stringify(note.tags ?? []),
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
  const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY createdAt DESC');
  return rows.map(mapNoteRow);
}

export async function getNoteById(db: SQLite.SQLiteDatabase, id: string): Promise<Note | null> {
  const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
  return row ? mapNoteRow(row) : null;
}

/** All distinct tags across notes (alphabetical) for filter chips. */
export async function getAllTags(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ tags: string | null }>(
    `SELECT tags FROM notes WHERE tags IS NOT NULL AND tags != ''`
  );
  const set = new Set<string>();
  for (const row of rows) {
    if (!row.tags) continue;
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) {
        for (const tag of parsed) {
          if (typeof tag === 'string' && tag.trim()) set.add(tag.trim());
        }
      }
    } catch {
      // ignore malformed rows
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Removes all user data: notes, their quizzes and flashcards. */
export async function clearAllNotes(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    DELETE FROM flashcards;
    DELETE FROM quizzes;
    DELETE FROM notes;
  `);
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
      `INSERT INTO flashcards (id, noteId, front, back, lastReviewed, interval, easeFactor, repetitions, dueDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.noteId,
        card.front,
        card.back,
        card.lastReviewed || null,
        card.interval,
        card.easeFactor,
        card.repetitions,
        card.dueDate,
      ]
    );
  }
}

export async function getFlashcardsByNoteId(
  db: SQLite.SQLiteDatabase,
  noteId: string
): Promise<Flashcard[]> {
  // Order by due date so the most overdue cards lead the review session.
  const rows = await db.getAllAsync<{
    id: string;
    noteId: string;
    front: string;
    back: string;
    lastReviewed: string | null;
    interval: number;
    easeFactor: number;
    repetitions: number;
    dueDate: string | null;
  }>('SELECT * FROM flashcards WHERE noteId = ? ORDER BY dueDate ASC', [noteId]);

  return rows.map((row) => ({
    id: row.id,
    noteId: row.noteId,
    front: row.front,
    back: row.back,
    lastReviewed: row.lastReviewed ?? undefined,
    interval: row.interval ?? 0,
    easeFactor: row.easeFactor ?? 2.5,
    repetitions: row.repetitions ?? 0,
    dueDate: row.dueDate ?? new Date(0).toISOString(),
  }));
}

/** Persists the spaced-repetition state after a card is reviewed. */
export async function updateFlashcardSchedule(
  db: SQLite.SQLiteDatabase,
  flashcardId: string,
  schedule: { interval: number; easeFactor: number; repetitions: number; dueDate: string },
  lastReviewed: string
) {
  await db.runAsync(
    `UPDATE flashcards
     SET interval = ?, easeFactor = ?, repetitions = ?, dueDate = ?, lastReviewed = ?
     WHERE id = ?`,
    [
      schedule.interval,
      schedule.easeFactor,
      schedule.repetitions,
      schedule.dueDate,
      lastReviewed,
      flashcardId,
    ]
  );
}

