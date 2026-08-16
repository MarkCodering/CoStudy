"use client";

import { useState } from "react";
import type { ExamPracticeState } from "@/hooks/useExamPractice";

export function SourcesScreen({ state }: { state: ExamPracticeState }) {
  const { createAndOpen } = state;
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");

  const canCreate = title.trim().length > 0;

  return (
    <div style={{ maxWidth: 640, padding: "38px 46px 60px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
        Intake · no past paper required
      </div>
      <h2 style={{ margin: "6px 0 4px", fontWeight: 400, fontSize: 36 }}>New practice set</h2>
      <p style={{ color: "var(--color-neutral-700)", maxWidth: "60ch", marginBottom: 26 }}>
        Build a set of questions from a syllabus, lecture notes or a textbook chapter — write them yourself, in the
        same editor and notebook as a real paper. Good for topics you don&rsquo;t have a past exam for yet.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label>Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Surface integrals — practice set"
          />
        </div>
        <div className="field">
          <label>Source (course, chapter, notes — whatever it's drawn from)</label>
          <input
            className="input"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. MATH 2410, Stewart Ch. 16"
          />
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!canCreate}
          onClick={() => createAndOpen({ title: title.trim(), course: course.trim(), kind: "Custom" })}
        >
          Create set and add questions
        </button>
      </div>
    </div>
  );
}
