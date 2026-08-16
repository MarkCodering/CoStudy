"use client";

import { EmptyState } from "@/components/EmptyState";
import { Rich } from "@/components/Rich";
import type { ExamPracticeState } from "@/hooks/useExamPractice";
import type { QuestionRecord } from "@/lib/models";

export function ReviewScreen({ state }: { state: ExamPracticeState }) {
  const {
    activePaper,
    go,
    editingQuestionId,
    questionForm,
    startAddQuestion,
    startEditQuestion,
    cancelQuestionForm,
    patchQuestionForm,
    saveQuestionForm,
    deleteQuestionAction,
  } = state;

  if (!activePaper) {
    return (
      <EmptyState
        eyebrow="Questions"
        title="No paper open"
        body="Open a paper from the Library, or add a new one, before editing its questions."
        action={
          <button className="btn btn-primary" onClick={() => go("library")}>
            Go to Library
          </button>
        }
      />
    );
  }

  const totalMarks = activePaper.questions.reduce((s, q) => s + q.marks, 0);
  const formOpen = editingQuestionId !== null;

  return (
    <div style={{ maxWidth: 1000, padding: "38px 46px 90px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            Questions · {activePaper.title}
          </div>
          <h2 style={{ margin: "6px 0 0", fontWeight: 400, fontSize: 36 }}>
            {activePaper.questions.length} question{activePaper.questions.length === 1 ? "" : "s"}
          </h2>
        </div>
        <div style={{ textAlign: "right", fontSize: 12.5, color: "var(--color-neutral-600)" }}>{totalMarks} marks</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
        {activePaper.questions.map((q) => (
          <QuestionRow
            key={q.id}
            q={q}
            editing={editingQuestionId === q.id}
            form={questionForm}
            onEdit={() => startEditQuestion(q)}
            onDelete={() => deleteQuestionAction(q.id)}
            onCancel={cancelQuestionForm}
            onSave={saveQuestionForm}
            onPatch={patchQuestionForm}
          />
        ))}
      </div>

      {editingQuestionId === "new" ? (
        <QuestionForm form={questionForm} onPatch={patchQuestionForm} onCancel={cancelQuestionForm} onSave={saveQuestionForm} isNew />
      ) : (
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={startAddQuestion} disabled={formOpen}>
          + Add question
        </button>
      )}

      {activePaper.questions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30, borderTop: "1px solid var(--color-divider)", paddingTop: 22 }}>
          <button className="btn btn-primary" onClick={() => go("notebook")}>
            Open in notebook
          </button>
          <button className="btn btn-secondary" onClick={() => go("timed")}>
            Sit under exam conditions
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionRow({
  q,
  editing,
  form,
  onEdit,
  onDelete,
  onCancel,
  onSave,
  onPatch,
}: {
  q: QuestionRecord;
  editing: boolean;
  form: ExamPracticeState["questionForm"];
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  onPatch: (patch: Partial<ExamPracticeState["questionForm"]>) => void;
}) {
  if (editing) {
    return (
      <div style={{ borderBottom: "1px solid var(--color-divider)", padding: "24px 0" }}>
        <QuestionForm form={form} onPatch={onPatch} onCancel={onCancel} onSave={onSave} />
      </div>
    );
  }
  return (
    <div style={{ borderBottom: "1px solid var(--color-divider)", padding: "24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>Question {q.num}</span>
        <span className="tag tag-outline">{q.topic}</span>
        <span style={{ fontSize: 11.5, color: "var(--color-neutral-600)", fontVariantNumeric: "tabular-nums" }}>{q.marks} marks</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 12.5, color: "var(--color-neutral-500)" }} onClick={onDelete}>
          Delete
        </button>
      </div>
      {q.prompt ? (
        <Rich text={q.prompt} style={{ fontSize: 15, lineHeight: 1.65, maxWidth: "74ch" }} />
      ) : (
        <p style={{ fontSize: 13, color: "var(--color-neutral-500)", fontStyle: "italic", margin: 0 }}>No prompt written yet.</p>
      )}
    </div>
  );
}

function QuestionForm({
  form,
  onPatch,
  onCancel,
  onSave,
  isNew,
}: {
  form: ExamPracticeState["questionForm"];
  onPatch: (patch: Partial<ExamPracticeState["questionForm"]>) => void;
  onCancel: () => void;
  onSave: () => void;
  isNew?: boolean;
}) {
  return (
    <div style={{ border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", padding: 20, marginTop: isNew ? 16 : 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
        <div className="field">
          <label>Number</label>
          <input className="input" value={form.num} onChange={(e) => onPatch({ num: e.target.value })} placeholder="1a" />
        </div>
        <div className="field">
          <label>Topic</label>
          <input className="input" value={form.topic} onChange={(e) => onPatch({ topic: e.target.value })} placeholder="Green's theorem" />
        </div>
        <div className="field">
          <label>Marks</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.marks}
            onChange={(e) => onPatch({ marks: e.target.value })}
            placeholder="8"
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 6 }}>
            Prompt · markdown, maths in $…$ or $$…$$
          </div>
          <textarea
            className="input"
            value={form.prompt}
            onChange={(e) => onPatch({ prompt: e.target.value })}
            placeholder="Let $C$ be…"
            style={{ minHeight: 160, fontFamily: "ui-monospace,Menlo,monospace", fontSize: 12.5, lineHeight: 1.6 }}
          />
        </div>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--color-neutral-500)", marginBottom: 6 }}>
            Preview
          </div>
          <Rich text={form.prompt} style={{ fontSize: 14.5, lineHeight: 1.6, paddingLeft: 18, borderLeft: "1px solid var(--color-divider)", minHeight: 160 }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary" onClick={onSave}>
          Save question
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
