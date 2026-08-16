"use client";

// The user's AI provider configuration — which provider, which model,
// and their own API key (or local Ollama URL). Persisted the same way as
// papers (SQLite in the desktop build, localStorage in a browser preview)
// but kept in its own single-row table: this is config, not app data.
//
// Nothing here ever leaves the user's machine except the direct request
// each provider call makes to that provider's own API — see src/lib/ai/.

import { useSyncExternalStore } from "react";
import { getDb, hasSqlite } from "@/lib/db";

export type AiProviderId = "anthropic" | "openai" | "ollama";

export interface AiSettings {
  provider: AiProviderId;
  anthropicApiKey: string;
  anthropicModel: string;
  openaiApiKey: string;
  openaiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export const DEFAULT_SETTINGS: AiSettings = {
  provider: "anthropic",
  anthropicApiKey: "",
  anthropicModel: "claude-opus-5",
  openaiApiKey: "",
  openaiModel: "gpt-5.6",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "llama3.2",
};

const STORAGE_KEY = "costudy.ai-settings.v1";
const SQL_KEY = "ai_settings";

let settings: AiSettings = DEFAULT_SETTINGS;
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

function safeParse(raw: string | null): AiSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function load(): Promise<AiSettings> {
  if (hasSqlite()) {
    const db = await getDb();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM settings WHERE key = $1", [SQL_KEY]);
    return rows.length ? safeParse(rows[0].value) : DEFAULT_SETTINGS;
  }
  return safeParse(typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null);
}

function persist() {
  const json = JSON.stringify(settings);
  if (hasSqlite()) {
    getDb()
      .then((db) => db.execute("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2", [SQL_KEY, json]))
      .catch((err) => console.error("[costudy] failed to save AI settings:", err));
  } else if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, json);
  }
}

function ensureHydrated() {
  if (ready || hydrating || typeof window === "undefined") return;
  hydrating = load()
    .then((loaded) => {
      settings = loaded;
      ready = true;
      hydrating = null;
      emit();
    })
    .catch((err) => {
      console.error("[costudy] failed to load AI settings:", err);
      ready = true;
      hydrating = null;
      emit();
    });
}

function snapshot() {
  ensureHydrated();
  return settings;
}
function serverSnapshot() {
  return DEFAULT_SETTINGS;
}

export function useAiSettings(): AiSettings {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function getAiSettings(): AiSettings {
  ensureHydrated();
  return settings;
}

export function updateAiSettings(patch: Partial<AiSettings>) {
  ensureHydrated();
  settings = { ...settings, ...patch };
  persist();
  emit();
}
