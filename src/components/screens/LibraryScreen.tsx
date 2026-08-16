"use client";

import { EmptyState } from "@/components/EmptyState";
import { answeredCount, isGraded, totalMarks, totalScore } from "@/lib/models";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

function tagStyle(kind: string) {
  return {
    display: "inline-flex" as const,
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 3,
    background: kind === "Custom" ? "var(--color-accent-100)" : "transparent",
    color: kind === "Custom" ? "var(--color-accent-800)" : "var(--color-neutral-700)",
    border: kind === "Custom" ? "1px solid transparent" : "1px solid var(--color-divider)",
  };
}

function relativeDay(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return days + " days ago";
  if (days < 14) return "last week";
  const weeks = Math.floor(days / 7);
  return weeks + " weeks ago";
}

export function LibraryScreen({ state }: { state: ExamPracticeState }) {
  const { papers, go, openPaper, removePaper } = state;

  if (papers.length === 0) {
    return (
      <EmptyState
        eyebrow="Library"
        title="No papers yet"
        body="Add a past exam or mock to work through, or write a practice set from scratch — nothing here is pre-loaded."
        action={
          <>
            <button className="btn btn-primary" onClick={() => go("upload")}>
              Add a paper
            </button>
            <button className="btn btn-secondary" onClick={() => go("sources")}>
              New practice set
            </button>
          </>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 1040, padding: "38px 46px 60px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Library
          </div>
          <h2 style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 36 }}>Your papers</h2>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-secondary" onClick={() => go("sources")}>
            New practice set
          </button>
          <button className="btn btn-primary" onClick={() => go("upload")}>
            Add a paper
          </button>
        </div>
      </div>

      <table className="table" style={{ width: "100%", marginTop: 22 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Paper</th>
            <th style={{ textAlign: "left" }}>Kind</th>
            <th style={{ textAlign: "right" }}>Questions</th>
            <th style={{ textAlign: "right" }}>Score</th>
            <th style={{ textAlign: "left" }}>Last worked</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {papers.map((p) => {
            const marks = totalMarks(p);
            const score = totalScore(p);
            const best = p.questions.length === 0 ? "—" : score != null && marks ? Math.round((score / marks) * 100) + "%" : "—";
            const action = p.questions.length === 0 ? "Add questions" : isGraded(p) ? "View marks" : "Open";
            const answered = answeredCount(p);
            return (
              <tr key={p.id}>
                <td>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{p.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)" }}>
                    {p.course}
                    {p.questions.length > 0 && !isGraded(p) ? " · " + answered + "/" + p.questions.length + " answered" : ""}
                  </div>
                </td>
                <td>
                  <span style={tagStyle(p.kind)}>{p.kind}</span>
                </td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.questions.length}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{best}</td>
                <td style={{ fontSize: 12.5, color: "var(--color-neutral-600)" }}>{relativeDay(p.updatedAt)}</td>
                <td style={{ textAlign: "right", display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => openPaper(p)}>
                    {action}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12.5, color: "var(--color-neutral-500)" }}
                    onClick={() => {
                      if (window.confirm('Delete "' + p.title + '"? This cannot be undone.')) removePaper(p.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
