"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createAiProvider } from "@/lib/ai";
import {
  providerName,
  updateAiSettings,
  useAiSettings,
  useAiSettingsReady,
  type AiProviderId,
  type AiSettings,
} from "@/lib/settings";

const PROVIDERS: { id: AiProviderId; detail: string }[] = [
  { id: "anthropic", detail: "Claude API" },
  { id: "openai", detail: "Responses API" },
  { id: "ollama", detail: "Local models" },
];

export function SettingsScreen() {
  const stored = useAiSettings();
  const ready = useAiSettingsReady();

  if (!ready) {
    return <div style={{ padding: "38px 46px", color: "var(--color-neutral-600)" }}>Loading settings…</div>;
  }

  return <SettingsForm initial={stored} />;
}

function SettingsForm({ initial }: { initial: AiSettings }) {
  const [draft, setDraft] = useState<AiSettings>(initial);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{ kind: "saved" | "testing" | "success" | "error"; message: string } | null>(null);

  const patch = (value: Partial<AiSettings>) => {
    setDraft((current) => ({ ...current, ...value }));
    setStatus(null);
  };

  const save = () => {
    updateAiSettings(draft);
    setStatus({ kind: "saved", message: "Settings saved on this device." });
  };

  const test = async () => {
    setStatus({ kind: "testing", message: "Checking the provider and model…" });
    try {
      await createAiProvider(draft).testConnection();
      setStatus({ kind: "success", message: `Connected to ${providerName(draft.provider)} successfully.` });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  const provider = draft.provider;
  const isOllama = provider === "ollama";
  const keyField = provider === "anthropic" ? "anthropicApiKey" : "openaiApiKey";
  const modelField = provider === "anthropic" ? "anthropicModel" : provider === "openai" ? "openaiModel" : "ollamaModel";

  return (
    <div style={{ maxWidth: 760, padding: "38px 46px 80px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
        Preferences
      </div>
      <h2 style={{ margin: "6px 0 4px", fontWeight: 400, fontSize: 36 }}>AI provider</h2>
      <p style={{ color: "var(--color-neutral-700)", maxWidth: "62ch", marginBottom: 26 }}>
        Choose what reads papers and suggests marks. Your configuration is saved only on this device. API requests go
        directly from CoStudy to the provider you select.
      </p>

      <div className="seg" style={{ marginBottom: 24 }}>
        {PROVIDERS.map((item) => (
          <label className="seg-opt" key={item.id} style={{ flexDirection: "column", alignItems: "flex-start", minWidth: 150 }}>
            <input type="radio" name="provider" checked={provider === item.id} onChange={() => patch({ provider: item.id })} />
            <span>{providerName(item.id)}</span>
            <span style={{ fontSize: 10.5, color: "var(--color-neutral-600)" }}>{item.detail}</span>
          </label>
        ))}
      </div>

      <div className="card" style={{ gap: 18, padding: 22 }}>
        {!isOllama ? (
          <div className="field">
            <label>{providerName(provider)} API key</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={draft[keyField]}
                onChange={(event) => patch({ [keyField]: event.target.value })}
                placeholder={provider === "openai" ? "sk-…" : "sk-ant-…"}
                aria-label={`${providerName(provider)} API key`}
              />
              <button className="btn btn-secondary btn-icon" onClick={() => setShowKey((visible) => !visible)} aria-label={showKey ? "Hide API key" : "Show API key"}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="field">
            <label>Ollama server URL</label>
            <input className="input" value={draft.ollamaBaseUrl} onChange={(event) => patch({ ollamaBaseUrl: event.target.value })} placeholder="http://localhost:11434" />
          </div>
        )}

        <div className="field">
          <label>Model</label>
          <input
            className="input"
            value={draft[modelField]}
            onChange={(event) => patch({ [modelField]: event.target.value })}
            placeholder={provider === "anthropic" ? "claude-opus-5" : provider === "openai" ? "gpt-5.6" : "llama3.2-vision"}
          />
          {isOllama ? (
            <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--color-neutral-600)" }}>
              Use a vision-capable model to read scanned papers or images. Text-based PDFs work with text models too.
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={save}>Save settings</button>
          <button className="btn btn-secondary" onClick={test} disabled={status?.kind === "testing"}>Test connection</button>
          {status ? (
            <span
              role={status.kind === "error" ? "alert" : "status"}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: status.kind === "error" ? "#8d2e25" : "var(--color-neutral-700)" }}
            >
              {status.kind === "success" || status.kind === "saved" ? <CheckCircle2 size={15} color="var(--color-accent-700)" /> : null}
              {status.message}
            </span>
          ) : null}
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 11.5, color: "var(--color-neutral-600)", lineHeight: 1.6 }}>
        Browser builds store this configuration in localStorage. The desktop app stores it in its local SQLite database.
        Anyone with access to this device and profile may be able to retrieve a saved key.
      </p>
    </div>
  );
}
