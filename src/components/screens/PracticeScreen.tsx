"use client";

import { EmptyState } from "@/components/EmptyState";
import { isGraded, totalMarks, totalScore } from "@/lib/models";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

export function PracticeScreen({ state }: { state: ExamPracticeState }) {
  const { papers, go, openPaper } = state;
  const practiceSets = papers.filter((p) => p.kind === "Custom");

  if (practiceSets.length === 0) {
    return (
      <EmptyState
        eyebrow="Practice sets"
        title="No practice sets yet"
        body="Write a set of questions from a syllabus, your notes, or a topic you know you're weak on."
        action={
          <button className="btn btn-primary" onClick={() => go("sources")}>
            New practice set
          </button>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 980, padding: "38px 46px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Practice sets
          </div>
          <h2 style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 36 }}>Your practice sets</h2>
        </div>
        <button className="btn btn-primary" onClick={() => go("sources")}>
          + New practice set
        </button>
      </div>

      {practiceSets.map((p) => {
        const marks = totalMarks(p);
        const score = totalScore(p);
        return (
          <div key={p.id} style={{ borderBottom: "1px solid var(--color-divider)", padding: "22px 0", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--color-neutral-600)", marginTop: 3 }}>
                {p.course || "No source noted"} · {p.questions.length} question{p.questions.length === 1 ? "" : "s"} · {marks} marks
                {isGraded(p) && score != null ? " · " + score + "/" + marks + " marked" : ""}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => openPaper(p)}>
              Open
            </button>
          </div>
        );
      })}
    </div>
  );
}
