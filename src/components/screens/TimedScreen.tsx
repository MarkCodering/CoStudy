"use client";

import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Rich } from "@/components/Rich";
import type { ExamPracticeState } from "@/hooks/useExamPractice";
import { totalMarks } from "@/lib/models";
import type { PaperRecord } from "@/lib/models";

export function TimedScreen({ state }: { state: ExamPracticeState }) {
  const { papers, timedActive, activePaper, go } = state;

  const eligible = papers.filter((p) => p.questions.length > 0);

  if (!timedActive || !activePaper) {
    if (eligible.length === 0) {
      return (
        <EmptyState
          eyebrow="Exam conditions"
          title="No papers ready"
          body="Add questions to a paper first, then come back here to sit it against the clock."
          action={
            <button className="btn btn-primary" onClick={() => go("upload")}>
              Add a paper
            </button>
          }
        />
      );
    }
    return <TimedSetup state={state} eligible={eligible} />;
  }

  return <TimedRunning state={state} paper={activePaper} />;
}

function TimedSetup({ state, eligible }: { state: ExamPracticeState; eligible: PaperRecord[] }) {
  const { startTimed } = state;
  const [paperId, setPaperId] = useState(eligible[0].id);
  const paper = eligible.find((p) => p.id === paperId) ?? eligible[0];
  const [minutes, setMinutes] = useState(() => Math.max(15, Math.round(totalMarks(paper) * 1.5)));

  return (
    <div style={{ maxWidth: 560, padding: "38px 46px 60px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
        Exam conditions
      </div>
      <h2 style={{ margin: "6px 0 4px", fontWeight: 400, fontSize: 36 }}>Sit a paper</h2>
      <p style={{ color: "var(--color-neutral-700)", marginBottom: 24, fontSize: 13.5 }}>
        Pick a paper and a time limit. Topic tags and previews are hidden while the clock runs, same as the real
        thing.
      </p>

      <div className="field">
        <label>Paper</label>
        <select
          className="input"
          value={paperId}
          onChange={(e) => {
            setPaperId(e.target.value);
            const p = eligible.find((x) => x.id === e.target.value);
            if (p) setMinutes(Math.max(15, Math.round(totalMarks(p) * 1.5)));
          }}
        >
          {eligible.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {p.questions.length} questions
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label>Minutes</label>
        <input
          className="input"
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, Math.round(Number(e.target.value) || 0)))}
          style={{ width: 120 }}
        />
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} onClick={() => startTimed(paper, minutes)}>
        Start
      </button>
    </div>
  );
}

function TimedRunning({ state, paper }: { state: ExamPracticeState; paper: PaperRecord }) {
  const { timedIdx, setTimedIdx, clock, timing, toggleTimer, finishTimed, setAnswerFor, prevQ, nextQ } = state;
  const tq = paper.questions[Math.min(timedIdx, paper.questions.length - 1)];

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
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 19 }}>{paper.title}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 5 }}>
          {paper.questions.map((q, i) => (
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
                color: i === timedIdx ? "var(--color-accent-800)" : q.answer ? "var(--color-text)" : "var(--color-neutral-500)",
                background: q.answer ? "var(--color-accent-100)" : "transparent",
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
        <button className="btn btn-primary" onClick={finishTimed}>
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
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>Question {tq.num}</span>
            <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>{tq.marks} marks</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)" }}>Topic hidden until you hand in</span>
          </div>
          <Rich text={tq.prompt} style={{ fontSize: 16, lineHeight: 1.75, margin: "20px 0 22px", maxWidth: "70ch" }} />
          <textarea
            className="input"
            value={tq.answer}
            onChange={(e) => setAnswerFor(tq.id, e.target.value)}
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
            <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>Preview is off in exam mode.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
