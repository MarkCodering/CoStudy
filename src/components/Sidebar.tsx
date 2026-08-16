"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Library,
  ListChecks,
  NotebookPen,
  Sparkles,
  Settings,
  Timer,
  UploadCloud,
} from "lucide-react";
import type { PaperRecord } from "@/lib/models";
import type { Screen } from "@/lib/types";

interface NavItem {
  label: string;
  key: Screen;
  icon: ReactNode;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function buildNavGroups(papers: PaperRecord[]): NavGroup[] {
  const needsQuestions = papers.filter((p) => p.questions.length === 0).length;
  const inProgress = papers.filter((p) => p.questions.length > 0 && !p.gradedAt).length;
  const practiceSets = papers.filter((p) => p.kind === "Custom").length;

  return [
    {
      label: "Study",
      items: [
        { label: "Library", key: "library", icon: <Library size={16} /> },
        {
          label: "Notebook",
          key: "notebook",
          icon: <NotebookPen size={16} />,
          badge: inProgress ? String(inProgress) : undefined,
        },
        { label: "Exam conditions", key: "timed", icon: <Timer size={16} /> },
      ],
    },
    {
      label: "Intake",
      items: [
        { label: "Add a paper", key: "upload", icon: <UploadCloud size={16} /> },
        { label: "New practice set", key: "sources", icon: <BookOpen size={16} /> },
        {
          label: "Edit questions",
          key: "review",
          icon: <ListChecks size={16} />,
          badge: needsQuestions ? String(needsQuestions) : undefined,
        },
      ],
    },
    {
      label: "Diagnosis",
      items: [
        { label: "Marked papers", key: "graded", icon: <CheckCircle2 size={16} /> },
        { label: "Weakness", key: "weak", icon: <BarChart3 size={16} /> },
        {
          label: "Practice sets",
          key: "practice",
          icon: <Sparkles size={16} />,
          badge: practiceSets ? String(practiceSets) : undefined,
        },
      ],
    },
  ];
}

const asideStyle: CSSProperties = {
  width: 248,
  flex: "none",
  borderRight: "1px solid var(--color-divider)",
  display: "flex",
  flexDirection: "column",
  background: "color-mix(in srgb, var(--color-surface) 45%, transparent)",
};

export function Sidebar({ screen, go, papers }: { screen: Screen; go: (s: Screen) => void; papers: PaperRecord[] }) {
  const navGroups = buildNavGroups(papers);

  return (
    <aside style={asideStyle}>
      <div style={{ padding: "26px 22px 18px" }}>
        <div
          style={{
            fontSize: 9.5,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Exam practice
        </div>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 28,
            lineHeight: 1.05,
            marginTop: 5,
            letterSpacing: "-.02em",
          }}
        >
          Marginalia
        </div>
        <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 3, fontStyle: "italic" }}>
          a marker in the margin
        </div>
      </div>
      <div style={{ height: 1, background: "var(--color-divider)" }} />
      <nav style={{ display: "flex", flexDirection: "column", gap: 1, padding: "14px 10px", overflow: "auto", flex: 1 }}>
        {navGroups.map((g) => (
          <div key={g.label}>
            <div
              style={{
                fontSize: 9.5,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "var(--color-neutral-500)",
                padding: "14px 12px 6px",
              }}
            >
              {g.label}
            </div>
            {g.items.map((it) => {
              const active = screen === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => go(it.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: 0,
                    cursor: "pointer",
                    borderRadius: "var(--radius-md)",
                    font: "inherit",
                    fontSize: 13.5,
                    fontFamily: "var(--font-body)",
                    background: active
                      ? "color-mix(in srgb, var(--color-accent) 13%, transparent)"
                      : "transparent",
                    color: active ? "var(--color-accent-800)" : "var(--color-text)",
                    boxShadow: active ? "inset 2px 0 0 var(--color-accent)" : "none",
                  }}
                >
                  <span style={{ display: "flex", opacity: 0.75 }}>{it.icon}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
                  {it.badge ? (
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: ".04em",
                        padding: "1px 6px",
                        borderRadius: 2,
                        background: "var(--color-accent-100)",
                        color: "var(--color-accent-800)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {it.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: "8px 10px 16px", borderTop: "1px solid var(--color-divider)" }}>
        <button
          onClick={() => go("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 12px",
            border: 0,
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            font: "inherit",
            fontSize: 13.5,
            background: screen === "settings" ? "color-mix(in srgb, var(--color-accent) 13%, transparent)" : "transparent",
            color: screen === "settings" ? "var(--color-accent-800)" : "var(--color-text)",
            boxShadow: screen === "settings" ? "inset 2px 0 0 var(--color-accent)" : "none",
          }}
        >
          <Settings size={16} style={{ opacity: 0.75 }} />
          Settings
        </button>
      </div>
    </aside>
  );
}
