"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import type { ExamPracticeState } from "@/hooks/useExamPractice";
import type { PaperKind } from "@/lib/models";

const KIND_OPTIONS: PaperKind[] = ["Past exam", "Mock"];

export function UploadScreen({ state }: { state: ExamPracticeState }) {
  const { createAndOpen } = state;
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [kind, setKind] = useState<PaperKind>("Past exam");

  const canCreate = title.trim().length > 0;

  return (
    <div style={{ maxWidth: 700, padding: "38px 46px 60px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--color-accent)" }}>
        Intake
      </div>
      <h2 style={{ margin: "6px 0 4px", fontWeight: 400, fontSize: 36 }}>Add a paper</h2>
      <p style={{ color: "var(--color-neutral-700)", maxWidth: "56ch", marginBottom: 26 }}>
        Attach a past or mock exam for reference, then type up its questions yourself in the editor that follows —
        CoStudy doesn&rsquo;t read PDFs for you, it just gives you a good place to work through one.
      </p>

      <label
        htmlFor="paper-file"
        style={{
          display: "block",
          border: "1px dashed var(--color-accent-400)",
          borderRadius: "var(--radius-md)",
          padding: "34px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: "color-mix(in srgb, var(--color-accent) 4%, transparent)",
        }}
      >
        <div style={{ color: "var(--color-accent)", opacity: 0.8, display: "flex", justifyContent: "center" }}>
          <FileText size={30} />
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, marginTop: 10 }}>
          {file ? file.name : "Attach a PDF (optional)"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-600)", marginTop: 4 }}>
          {file ? "Click to choose a different file" : "Click to choose a file — kept for reference only"}
        </div>
        <input
          id="paper-file"
          type="file"
          accept="application/pdf,image/*"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 26 }}>
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vector Calculus · Final 2023" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Course</label>
            <input className="input" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. MATH 2410" />
          </div>
          <div className="field">
            <label>Kind</label>
            <div className="seg">
              {KIND_OPTIONS.map((k) => (
                <label className="seg-opt" key={k}>
                  <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
                  {k}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!canCreate}
          onClick={() => createAndOpen({ title: title.trim(), course: course.trim(), kind, fileName: file?.name })}
        >
          Create paper and add questions
        </button>
      </div>
    </div>
  );
}
