"use client";

import { EmptyState } from "@/components/EmptyState";
import { Rich } from "@/components/Rich";
import type { ExamPracticeState } from "@/hooks/useExamPractice";
import { totalMarks as sumMarks } from "@/lib/models";

export function GradedScreen({ state }: { state: ExamPracticeState }) {
  const { activePaper, go, markDraft, setMarkScore, setMarkNote, saveMarksAction, reopenMarking, remarking } = state;

  if (!activePaper) {
    return (
      <EmptyState
        eyebrow="Marked papers"
        title="No paper open"
        body="Open a paper from the Library to mark it."
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
        eyebrow="Marked papers"
        title="No questions yet"
        body={`Add questions to "${activePaper.title}" before marking it.`}
        action={
          <button className="btn btn-primary" onClick={() => go("review")}>
            Add questions
          </button>
        }
      />
    );
  }

  const editable = !activePaper.gradedAt || remarking;
  const marksTotal = sumMarks(activePaper);

  if (editable) {
    return (
      <div style={{ maxWidth: 900, padding: "38px 46px 80px" }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          Marking · {activePaper.title}
        </div>
        <h2 style={{ margin: "6px 0 16px", fontWeight: 400, fontSize: 36 }}>Mark your own paper</h2>
        <p style={{ fontSize: 13, color: "var(--color-neutral-700)", maxWidth: "62ch", marginBottom: 26 }}>
          Score each answer against what you know it should have said, and jot down why marks were lost — that note
          is what feeds the Weakness page.
        </p>

        {activePaper.questions.map((q) => {
          const draft = markDraft[q.id] ?? { score: "", note: "" };
          return (
            <div key={q.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "24px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>Question {q.num}</span>
                <span className="tag tag-outline">{q.topic}</span>
                <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)" }}>out of {q.marks} marks</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 8 }}>
                    What you wrote
                  </div>
                  <Rich text={q.answer || "_Left blank._"} style={{ fontSize: 13.5, lineHeight: 1.65 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="field">
                    <label>Marks awarded (0–{q.marks})</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={q.marks}
                      value={draft.score}
                      onChange={(e) => setMarkScore(q.id, e.target.value)}
                      style={{ width: 120 }}
                    />
                  </div>
                  <div className="field">
                    <label>Note — what to remember</label>
                    <textarea
                      className="input"
                      value={draft.note}
                      onChange={(e) => setMarkNote(q.id, e.target.value)}
                      placeholder="e.g. wrong moment of inertia — used the centre, not the pivot"
                      style={{ minHeight: 70, fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={saveMarksAction}>
          Save marks
        </button>
      </div>
    );
  }

  const score = activePaper.questions.reduce((s, q) => s + (q.score ?? 0), 0);
  const pct = marksTotal ? Math.round((score / marksTotal) * 100) : 0;

  return (
    <div style={{ maxWidth: 1000, padding: "38px 46px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Marked · {activePaper.title}
          </div>
          <h2 style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 36 }}>Your marks</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 56, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {score}
            <span style={{ fontSize: 26, color: "var(--color-neutral-500)" }}>/{marksTotal}</span>
          </div>
          <div style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-600)", marginTop: 6 }}>
            {pct} per cent
          </div>
        </div>
      </div>

      {activePaper.questions.map((q) => (
        <div key={q.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "28px 0", display: "flex", gap: 26 }}>
          <div style={{ width: 78, flex: "none", textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: 30,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                color: q.score === q.marks ? "var(--color-accent-700)" : "var(--color-text)",
              }}
            >
              {q.score ?? 0}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-neutral-500)", marginTop: 5, fontVariantNumeric: "tabular-nums" }}>of {q.marks}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>Question {q.num}</span>
              <span className="tag tag-outline">{q.topic}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 8 }}>
                  What you wrote
                </div>
                <Rich text={q.answer || "_Left blank._"} style={{ fontSize: 13.5, lineHeight: 1.7 }} />
              </div>
              <div style={{ borderLeft: "1px solid var(--color-divider)", paddingLeft: 24 }}>
                <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 8 }}>
                  Your note
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: q.note ? "var(--color-text)" : "var(--color-neutral-500)" }}>
                  {q.note || "No note."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
        <button className="btn btn-primary" onClick={() => go("weak")}>
          Where am I weak?
        </button>
        <button className="btn btn-secondary" onClick={() => go("notebook")}>
          Reopen the notebook
        </button>
        <button className="btn btn-secondary" onClick={reopenMarking}>
          Re-mark
        </button>
      </div>
    </div>
  );
}
