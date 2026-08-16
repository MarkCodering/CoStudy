"use client";

// Local persistence for the user's own papers/questions — no server, no
// fixtures. Backed by localStorage, which in the Tauri build lives in the
// app's own webview data directory, so it survives restarts like any other
// desktop app's local database. Swap `load`/`persist` for the Tauri Store
// plugin later without touching call sites if a real file-backed store is
// wanted.

import { useSyncExternalStore } from "react";
import { newId } from "@/lib/id";
import type { PaperRecord, QuestionRecord } from "@/lib/models";

const STORAGE_KEY = "costudy.papers.v1";

let papers: PaperRecord[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function safeParse(raw: string | null): PaperRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  papers = safeParse(window.localStorage.getItem(STORAGE_KEY));
  hydrated = true;
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot() {
  ensureHydrated();
  return papers;
}

const EMPTY: PaperRecord[] = [];
function serverSnapshot() {
  return EMPTY;
}

/** Live-updating list of every paper the user has created, newest first. */
export function usePapers(): PaperRecord[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function usePaper(id: string | null): PaperRecord | undefined {
  const all = usePapers();
  return id ? all.find((p) => p.id === id) : undefined;
}

export function getPaper(id: string): PaperRecord | undefined {
  ensureHydrated();
  return papers.find((p) => p.id === id);
}

function touch(paper: PaperRecord): PaperRecord {
  return { ...paper, updatedAt: new Date().toISOString() };
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
  persist();
  emit();
  return paper;
}

export function deletePaper(id: string) {
  ensureHydrated();
  papers = papers.filter((p) => p.id !== id);
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
  updatePaper(paperId, (p) => ({
    ...p,
    questions: [...p.questions, { ...q, id: newId("q"), answer: "" }],
  }));
}

export function updateQuestion(paperId: string, questionId: string, patch: Partial<QuestionRecord>) {
  updatePaper(paperId, (p) => ({
    ...p,
    questions: p.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
  }));
}

export function removeQuestion(paperId: string, questionId: string) {
  updatePaper(paperId, (p) => ({
    ...p,
    questions: p.questions.filter((q) => q.id !== questionId),
  }));
}

export function setAnswer(paperId: string, questionId: string, answer: string) {
  updateQuestion(paperId, questionId, { answer });
}

export function saveMarks(paperId: string) {
  updatePaper(paperId, (p) => ({ ...p, gradedAt: new Date().toISOString() }));
}
