"use client";

// Real persistence for the desktop build: a SQLite database living in the
// Tauri app's own data directory (via the official SQL plugin), so papers
// and questions survive restarts and can be inspected/backed up like any
// other local app's database. When the same code runs in a plain browser
// (e.g. `next dev` for UI work, or a future web deploy) there is no Tauri
// runtime to talk to, so we fall back to localStorage — see store.ts and
// settings.ts, which both branch on `hasSqlite()`.

import { isTauri } from "@tauri-apps/api/core";

// Only import the plugin type when we might actually use it — avoids
// pulling Tauri's IPC bridge into a pure-browser bundle unnecessarily.
type SqlDatabase = import("@tauri-apps/plugin-sql").default;

let dbPromise: Promise<SqlDatabase> | null = null;

export function hasSqlite(): boolean {
  return typeof window !== "undefined" && isTauri();
}

/** Lazily opens (and migrates) the app database. Only call when hasSqlite() is true. */
export function getDb(): Promise<SqlDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      const db = await Database.load("sqlite:costudy.db");
      await db.execute("PRAGMA foreign_keys = ON;");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS papers (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          course TEXT NOT NULL,
          kind TEXT NOT NULL,
          file_name TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          graded_at TEXT
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
          position INTEGER NOT NULL DEFAULT 0,
          num TEXT NOT NULL,
          topic TEXT NOT NULL,
          marks INTEGER NOT NULL DEFAULT 0,
          prompt TEXT NOT NULL DEFAULT '',
          answer TEXT NOT NULL DEFAULT '',
          score INTEGER,
          note TEXT
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}
