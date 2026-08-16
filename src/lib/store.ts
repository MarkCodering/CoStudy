"use client";

// The user's papers and questions — real, persisted, never seeded. Two
// backends: a SQLite database (via the Tauri SQL plugin) when running as
// the packaged desktop app, and localStorage as a fallback when the same
// code runs in a plain browser (dev preview, or a future web build). See
// db.ts for the SQLite schema and hasSqlite() for how the branch is made.

import { useSyncExternalStore } from "react";
import { newId } from "@/lib/id";
import { getDb, hasSqlite } from "@/lib/db";
import type { PaperRecord, QuestionRecord } from "@/lib/models";

const STORAGE_KEY = "costudy.papers.v1";

let papers: PaperRecord[] = [];
let ready = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// — localStorage backend —

function safeParse(raw: string | null): PaperRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLocalStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

// — SQLite backend —

interface PaperRow {
  id: string;
  title: string;
  course: string;
  kind: PaperRecord["kind"];
  file_name: string | null;
  created_at: string;
  updated_at: string;
  graded_at: string | null;
}

interface QuestionRow {
  id: string;
  paper_id: string;
  position: number;
  num: string;
  topic: string;
  marks: number;
  prompt: string;
  answer: string;
  score: number | null;
  note: string | null;
}

async function loadFromSqlite(): Promise<PaperRecord[]> {
  const db = await getDb();
  const paperRows = await db.select<PaperRow[]>("SELECT * FROM papers ORDER BY created_at DESC");
  const questionRows = await db.select<QuestionRow[]>("SELECT * FROM questions ORDER BY position ASC");
  const byPaper = new Map<string, QuestionRecord[]>();
  for (const q of questionRows) {
    const list = byPaper.get(q.paper_id) ?? [];
    list.push({
      id: q.id,
      num: q.num,
      topic: q.topic,
      marks: q.marks,
      prompt: q.prompt,
      answer: q.answer,
      score: q.score ?? undefined,
      note: q.note ?? undefined,
    });
    byPaper.set(q.paper_id, list);
  }
  return paperRows.map((p) => ({
    id: p.id,
    title: p.title,
    course: p.course,
    kind: p.kind,
    fileName: p.file_name ?? undefined,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    gradedAt: p.graded_at ?? undefined,
    questions: byPaper.get(p.id) ?? [],
  }));
}

function run(sql: string, args: unknown[]) {
  // Fire-and-forget: the in-memory cache is the source of truth for the UI
  // (updated synchronously before this is called), so callers never await
  // the write. Errors are surfaced to the console rather than thrown, since
  // there's no synchronous caller left to catch them.
  getDb()
    .then((db) => db.execute(sql, args))
    .catch((err) => console.error("[costudy] sqlite write failed:", sql, err));
}

function persist() {
  if (hasSqlite()) return; // SQLite mutations persist themselves, per-statement (see mutators below)
  persistLocalStorage();
}

// — hydration —

function ensureHydrated() {
  if (ready || hydrating || typeof window === "undefined") return;
  hydrating = (hasSqlite() ? loadFromSqlite() : Promise.resolve(safeParse(window.localStorage.getItem(STORAGE_KEY))))
    .then((loaded) => {
      papers = loaded;
      ready = true;
      hydrating = null;
      emit();
    })
    .catch((err) => {
      console.error("[costudy] failed to load papers:", err);
      ready = true;
      hydrating = null;
      emit();
    });
}

const EMPTY: PaperRecord[] = [];
function serverSnapshot() {
  return EMPTY;
}

function snapshot() {
  ensureHydrated();
  return papers;
}

/** Live-updating list of every paper the user has created, newest first. */
export function usePapers(): PaperRecord[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function usePaper(id: string | null): PaperRecord | undefined {
  const all = usePapers();
  return id ? all.find((p) => p.id === id) : undefined;
}

/** True once the initial load (SQLite or localStorage) has completed. */
export function useLibraryReady(): boolean {
  return useSyncExternalStore(subscribe, () => {
    ensureHydrated();
    return ready;
  }, () => false);
}

export function getPaper(id: string): PaperRecord | undefined {
  ensureHydrated();
  return papers.find((p) => p.id === id);
}

function touch(paper: PaperRecord): PaperRecord {
  const updatedAt = new Date().toISOString();
  if (hasSqlite()) run("UPDATE papers SET updated_at = $1 WHERE id = $2", [updatedAt, paper.id]);
  return { ...paper, updatedAt };
}

export function createPaper(input: { title: string; course: string; kind: PaperRecord["kind"]; fileName?: string }): PaperRecord {
  ensureHydrated();
  const now = new Date().toISOString();
  const paper: PaperRecord = {
    id: newId("paper"),
    title: input.title,
    course: input.course,
    kind: input.kind,
    fileName: input.fileName,
    createdAt: now,
    updatedAt: now,
    questions: [],
  };
  papers = [paper, ...papers];
  if (hasSqlite()) {
    run("INSERT INTO papers (id, title, course, kind, file_name, created_at, updated_at, graded_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
      paper.id,
      paper.title,
      paper.course,
      paper.kind,
      paper.fileName ?? null,
      paper.createdAt,
      paper.updatedAt,
      null,
    ]);
  }
  persist();
  emit();
  return paper;
}

export function deletePaper(id: string) {
  ensureHydrated();
  papers = papers.filter((p) => p.id !== id);
  if (hasSqlite()) run("DELETE FROM papers WHERE id = $1", [id]);
  persist();
  emit();
}

function updatePaper(id: string, updater: (p: PaperRecord) => PaperRecord) {
  ensureHydrated();
  papers = papers.map((p) => (p.id === id ? touch(updater(p)) : p));
  persist();
  emit();
}

export function addQuestion(paperId: string, q: Omit<QuestionRecord, "id" | "answer" | "score" | "note">) {
  const paper = papers.find((p) => p.id === paperId);
  const position = paper ? paper.questions.length : 0;
  const question: QuestionRecord = { ...q, id: newId("q"), answer: "" };
  updatePaper(paperId, (p) => ({ ...p, questions: [...p.questions, question] }));
  if (hasSqlite()) {
    run(
      "INSERT INTO questions (id, paper_id, position, num, topic, marks, prompt, answer, score, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [question.id, paperId, position, question.num, question.topic, question.marks, question.prompt, question.answer, null, null]
    );
  }
}

export function updateQuestion(paperId: string, questionId: string, patch: Partial<QuestionRecord>) {
  updatePaper(paperId, (p) => ({
    ...p,
    questions: p.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
  }));
  if (hasSqlite()) {
    const sets: string[] = [];
    const args: unknown[] = [];
    let i = 1;
    for (const [key, col] of [
      ["num", "num"],
      ["topic", "topic"],
      ["marks", "marks"],
      ["prompt", "prompt"],
      ["answer", "answer"],
      ["score", "score"],
      ["note", "note"],
    ] as const) {
      if (key in patch) {
        sets.push(`${col} = $${i}`);
        args.push((patch as Record<string, unknown>)[key] ?? null);
        i++;
      }
    }
    if (sets.length) {
      args.push(questionId);
      run(`UPDATE questions SET ${sets.join(", ")} WHERE id = $${i}`, args);
    }
  }
}

export function removeQuestion(paperId: string, questionId: string) {
  updatePaper(paperId, (p) => ({ ...p, questions: p.questions.filter((q) => q.id !== questionId) }));
  if (hasSqlite()) run("DELETE FROM questions WHERE id = $1", [questionId]);
}

export function setAnswer(paperId: string, questionId: string, answer: string) {
  updateQuestion(paperId, questionId, { answer });
}

export function saveMarks(paperId: string) {
  const gradedAt = new Date().toISOString();
  updatePaper(paperId, (p) => ({ ...p, gradedAt }));
  if (hasSqlite()) run("UPDATE papers SET graded_at = $1 WHERE id = $2", [gradedAt, paperId]);
}
