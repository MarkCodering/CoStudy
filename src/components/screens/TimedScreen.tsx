"use client";

import { Rich } from "@/components/Rich";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

export function TimedScreen({ state }: { state: ExamPracticeState }) {
  const {
    workList,
    timedIdx,
    setTimedIdx,
    clock,
    timing,
    toggleTimer,
    grade,
    answerOf,
    setAnswer,
    prevQ,
    nextQ,
    practice,
  } = state;

  const tq = workList[timedIdx];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-100)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "16px 40px",
          borderBottom: "1px solid var(--color-divider)",
          background: "var(--color-bg)",
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Exam conditions
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>
            {practice ? "Practice set B" : "Vector Calculus · Final 2023"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 5 }}>
          {workList.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setTimedIdx(i)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 2,
                cursor: "pointer",
                font: "inherit",
                fontSize: 12.5,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "var(--font-body)",
                border: "1px solid " + (i === timedIdx ? "var(--color-accent)" : "var(--color-divider)"),
                color: i === timedIdx ? "var(--color-accent-800)" : answerOf(q.id) ? "var(--color-text)" : "var(--color-neutral-500)",
                background: answerOf(q.id) ? "var(--color-accent-100)" : "transparent",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "right", minWidth: 118 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 27, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: ".01em" }}>
            {clock}
          </div>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-neutral-600)", marginTop: 3 }}>
            remaining
          </div>
        </div>
        <button className="btn btn-secondary" onClick={toggleTimer}>
          {timing ? "Pause" : "Resume"}
        </button>
        <button className="btn btn-primary" onClick={grade}>
          Hand in
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "38px 40px 60px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 880,
            background: "var(--color-bg)",
            border: "1px solid var(--color-divider)",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "var(--radius-md)",
            padding: "34px 40px 30px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--color-divider)", paddingBottom: 14 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>{tq.label}</span>
            <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>{tq.marks} marks</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)" }}>Topic hidden until you hand in</span>
          </div>
          <Rich text={tq.prompt} style={{ fontSize: 16, lineHeight: 1.75, margin: "20px 0 22px", maxWidth: "70ch" }} />
          <textarea
            className="input"
            value={answerOf(tq.id)}
            onChange={(e) => setAnswer(tq.id, e.target.value)}
            placeholder="Working…"
            style={{ minHeight: 300, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 13, lineHeight: 1.75 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={prevQ}>
              Previous
            </button>
            <button className="btn btn-secondary" onClick={nextQ}>
              Next
            </button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>Preview and AI help are off in exam mode.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
