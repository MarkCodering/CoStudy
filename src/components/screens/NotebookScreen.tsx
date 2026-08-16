"use client";

import type { CSSProperties } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Rich } from "@/components/Rich";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

const SNIPPETS: [string, string][] = [
  ["$$…$$", "\n\n$$  $$\n\n"],
  ["\\frac{}{}", "\\frac{}{}"],
  ["\\int", "\\int_{}^{} "],
  ["\\partial", "\\partial "],
  ["\\mathbf{}", "\\mathbf{}"],
];

export function NotebookScreen({ state }: { state: ExamPracticeState }) {
  const { activePaper, go, previewMode, tab, showWriteTab, showPreviewTab, setAnswerFor, insertSnippet } = state;

  if (!activePaper) {
    return (
      <EmptyState
        eyebrow="Notebook"
        title="No paper open"
        body="Open a paper from the Library to start working through its questions."
        action={
          <button className="btn btn-primary" onClick={() => go("library")}>
            Go to Library
          </button>
        }
      />
    );
  }
  if (activePaper.questions.length === 0) {
    return (
      <EmptyState
        eyebrow="Notebook"
        title="No questions yet"
        body={`"${activePaper.title}" doesn't have any questions written down.`}
        action={
          <button className="btn btn-primary" onClick={() => go("review")}>
            Add questions
          </button>
        }
      />
    );
  }

  const questions = activePaper.questions;
  const answeredCount = questions.filter((q) => q.answer.trim()).length;
  const tabbed = previewMode === "Tabbed";

  const editorStyle: CSSProperties =
    previewMode === "Side by side"
      ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 18, alignItems: "start" }
      : { display: "flex", flexDirection: "column", gap: 18, marginTop: 18 };
  const previewPaneStyle: CSSProperties =
    previewMode === "Side by side"
      ? { borderLeft: "1px solid var(--color-divider)", paddingLeft: 22, minHeight: 220 }
      : { borderTop: "1px solid var(--color-divider)", paddingTop: 14 };

  const showWrite = !tabbed || tab === "write";
  const showPreview = previewMode === "Side by side" || previewMode === "Below the answer" || (tabbed && tab === "preview");

  return (
    <div style={{ padding: "0 0 120px" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--color-bg)",
          borderBottom: "1px solid var(--color-divider)",
          padding: "22px 46px 16px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Notebook · {activePaper.course || activePaper.kind}
          </div>
          <h3 style={{ margin: "5px 0 0", fontWeight: 400, fontSize: 27 }}>{activePaper.title}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>
            {answeredCount} of {questions.length} attempted
          </span>
          {tabbed && (
            <div className="seg">
              <label className="seg-opt">
                <input type="radio" name="pane" checked={tab === "write"} onChange={showWriteTab} />
                Write
              </label>
              <label className="seg-opt">
                <input type="radio" name="pane" checked={tab === "preview"} onChange={showPreviewTab} />
                Preview
              </label>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => go("graded")}>
            Mark this paper
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, padding: "14px 46px 0" }}>
        {questions.map((q) => (
          <div key={q.id} style={{ padding: "30px 0", borderBottom: "1px solid var(--color-divider)" }}>
            <div style={{ display: "flex", gap: 26, alignItems: "baseline" }}>
              <div style={{ width: 78, flex: "none", textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 30,
                    lineHeight: 1,
                    color: "var(--color-accent-700)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {q.num}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-neutral-500)", marginTop: 5, fontVariantNumeric: "tabular-nums" }}>
                  {q.marks} marks
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <span className="tag tag-outline">{q.topic}</span>
                </div>
                {q.prompt ? (
                  <Rich text={q.prompt} style={{ fontSize: 15.5, lineHeight: 1.7, maxWidth: "72ch" }} />
                ) : (
                  <p style={{ fontSize: 13, color: "var(--color-neutral-500)", fontStyle: "italic", margin: 0 }}>No prompt written.</p>
                )}

                <div style={editorStyle}>
                  {showWrite && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <div
                          style={{
                            fontSize: 9.5,
                            letterSpacing: ".16em",
                            textTransform: "uppercase",
                            color: "var(--color-neutral-500)",
                          }}
                        >
                          Your working · markdown, maths in $$…$$
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-neutral-500)", fontVariantNumeric: "tabular-nums" }}>
                          {q.answer.length} characters
                        </div>
                      </div>
                      <textarea
                        className="input"
                        value={q.answer}
                        onChange={(e) => setAnswerFor(q.id, e.target.value)}
                        placeholder="Start with the theorem you are invoking, then the substitution…"
                        style={{
                          minHeight: 220,
                          fontFamily: "ui-monospace,Menlo,monospace",
                          fontSize: 12.5,
                          lineHeight: 1.7,
                          background: "color-mix(in srgb, var(--color-surface) 40%, transparent)",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {SNIPPETS.map(([label, snippet]) => (
                          <button
                            key={label}
                            className="btn btn-secondary"
                            style={{ fontSize: 11.5, padding: "3px 8px", minHeight: 0, fontFamily: "ui-monospace,Menlo,monospace" }}
                            onClick={() => insertSnippet(q, snippet)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {showPreview && (
                    <div style={previewPaneStyle}>
                      <div
                        style={{
                          fontSize: 9.5,
                          letterSpacing: ".16em",
                          textTransform: "uppercase",
                          color: "var(--color-neutral-500)",
                          marginBottom: 8,
                        }}
                      >
                        Set as the marker sees it
                      </div>
                      <Rich text={q.answer || "_Nothing written yet._"} style={{ fontSize: 14.5, lineHeight: 1.75 }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
