"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addQuestion,
  createPaper,
  deletePaper as deletePaperRecord,
  removeQuestion,
  saveMarks,
  setAnswer as setAnswerRecord,
  updateQuestion,
  usePaper,
  usePapers,
} from "@/lib/store";
import type { PaperRecord, QuestionRecord } from "@/lib/models";
import type { PreviewMode, Screen } from "@/lib/types";

export interface QuestionFormState {
  num: string;
  topic: string;
  marks: string;
  prompt: string;
}

const EMPTY_FORM: QuestionFormState = { num: "", topic: "", marks: "", prompt: "" };

/**
 * All app state for CoStudy's Exam Practice area. Papers/questions
 * themselves live in `@/lib/store` (real, persisted, user-authored);
 * this hook holds the transient UI state — which screen, which paper is
 * open, in-progress forms — the React counterpart to the mockup's
 * `Component.state`, now backed by real data instead of fixtures.
 */
export function useExamPractice() {
  const papers = usePapers();

  const [screen, setScreen] = useState<Screen>("library");
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const activePaper = usePaper(activePaperId) ?? null;
  // Whether the Graded screen shows its editable marking form even though
  // the paper already has a gradedAt stamp — set by reopenMarking(), reset
  // whenever navigation leaves the graded screen.
  const [remarking, setRemarking] = useState(false);

  const go = useCallback((next: Screen) => {
    setScreen(next);
    if (next !== "graded") setRemarking(false);
  }, []);

  const openPaper = useCallback(
    (paper: PaperRecord) => {
      setActivePaperId(paper.id);
      if (!paper.questions.length) go("review");
      else if (paper.gradedAt) go("graded");
      else go("notebook");
    },
    [go]
  );

  // — Creating a paper —
  const createAndOpen = useCallback(
    (input: { title: string; course: string; kind: PaperRecord["kind"]; fileName?: string }) => {
      const paper = createPaper(input);
      setActivePaperId(paper.id);
      go("review");
    },
    [go]
  );

  const removePaper = useCallback(
    (id: string) => {
      deletePaperRecord(id);
      if (activePaperId === id) {
        setActivePaperId(null);
        go("library");
      }
    },
    [activePaperId, go]
  );

  // — Question editor (Review screen) —
  const [editingQuestionId, setEditingQuestionId] = useState<string | "new" | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(EMPTY_FORM);

  const startAddQuestion = useCallback(() => {
    setQuestionForm(EMPTY_FORM);
    setEditingQuestionId("new");
  }, []);
  const startEditQuestion = useCallback((q: QuestionRecord) => {
    setQuestionForm({ num: q.num, topic: q.topic, marks: String(q.marks), prompt: q.prompt });
    setEditingQuestionId(q.id);
  }, []);
  const cancelQuestionForm = useCallback(() => {
    setEditingQuestionId(null);
    setQuestionForm(EMPTY_FORM);
  }, []);
  const patchQuestionForm = useCallback((patch: Partial<QuestionFormState>) => {
    setQuestionForm((f) => ({ ...f, ...patch }));
  }, []);
  const saveQuestionForm = useCallback(() => {
    if (!activePaperId || !editingQuestionId) return;
    const marks = Math.max(0, Math.round(Number(questionForm.marks) || 0));
    const payload = {
      num: questionForm.num.trim() || String(activePaper ? activePaper.questions.length + 1 : 1),
      topic: questionForm.topic.trim() || "Untagged",
      marks,
      prompt: questionForm.prompt,
    };
    if (editingQuestionId === "new") {
      addQuestion(activePaperId, payload);
    } else {
      updateQuestion(activePaperId, editingQuestionId, payload);
    }
    cancelQuestionForm();
  }, [activePaperId, activePaper, editingQuestionId, questionForm, cancelQuestionForm]);
  const deleteQuestionAction = useCallback(
    (id: string) => {
      if (!activePaperId) return;
      removeQuestion(activePaperId, id);
    },
    [activePaperId]
  );

  // — Notebook —
  const [previewMode] = useState<PreviewMode>("Side by side");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const showWriteTab = useCallback(() => setTab("write"), []);
  const showPreviewTab = useCallback(() => setTab("preview"), []);
  const setAnswerFor = useCallback(
    (questionId: string, value: string) => {
      if (!activePaperId) return;
      setAnswerRecord(activePaperId, questionId, value);
    },
    [activePaperId]
  );
  const insertSnippet = useCallback(
    (q: QuestionRecord, snippet: string) => {
      if (!activePaperId) return;
      setAnswerRecord(activePaperId, q.id, q.answer + snippet);
    },
    [activePaperId]
  );

  // — Marking (self-graded, no simulated AI) —
  // `markDraft` holds only the fields the user has actually edited this
  // session; draftFor() falls back to the question's own score/note, so
  // there's no need to pre-seed it on mount (which would mean calling
  // setState from inside an effect).
  const [markDraft, setMarkDraft] = useState<Record<string, { score: string; note: string }>>({});
  const draftFor = useCallback(
    (q: QuestionRecord) => markDraft[q.id] ?? { score: q.score != null ? String(q.score) : "", note: q.note ?? "" },
    [markDraft]
  );
  const setMarkScore = useCallback(
    (q: QuestionRecord, score: string) => {
      setMarkDraft((d) => ({ ...d, [q.id]: { ...draftFor(q), score } }));
    },
    [draftFor]
  );
  const setMarkNote = useCallback(
    (q: QuestionRecord, note: string) => {
      setMarkDraft((d) => ({ ...d, [q.id]: { ...draftFor(q), note } }));
    },
    [draftFor]
  );
  const saveMarksAction = useCallback(() => {
    if (!activePaperId || !activePaper) return;
    for (const q of activePaper.questions) {
      const draft = draftFor(q);
      const score = Math.max(0, Math.min(q.marks, Math.round(Number(draft.score) || 0)));
      updateQuestion(activePaperId, q.id, { score, note: draft.note.trim() || undefined });
    }
    saveMarks(activePaperId);
    setRemarking(false);
  }, [activePaperId, activePaper, draftFor]);
  // The store never "un-grades" a paper — re-marking just flips a local
  // flag so the screen shows the editable form again; saving overwrites
  // the previous marks and gradedAt stamp.
  const reopenMarking = useCallback(() => setRemarking(true), []);

  // — Timed (exam conditions) —
  const [timedIdx, setTimedIdx] = useState(0);
  const [secs, setSecs] = useState(0);
  const [timing, setTiming] = useState(false);
  const [timedActive, setTimedActive] = useState(false);
  useEffect(() => {
    if (!timing || screen !== "timed") return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [timing, screen]);
  const startTimed = useCallback(
    (paper: PaperRecord, minutes: number) => {
      setActivePaperId(paper.id);
      setTimedIdx(0);
      setSecs(Math.max(1, Math.round(minutes)) * 60);
      setTiming(true);
      setTimedActive(true);
      go("timed");
    },
    [go]
  );
  const finishTimed = useCallback(() => {
    setTiming(false);
    setTimedActive(false);
    go("graded");
  }, [go]);
  const toggleTimer = useCallback(() => setTiming((t) => !t), []);
  const prevQ = useCallback(() => setTimedIdx((i) => Math.max(0, i - 1)), []);
  const nextQ = useCallback(() => {
    setTimedIdx((i) => Math.min((activePaper?.questions.length ?? 1) - 1, i + 1));
  }, [activePaper]);
  const clock = useMemo(() => {
    const mm = Math.floor(secs / 60);
    const hh = Math.floor(mm / 60);
    return hh + ":" + String(mm % 60).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
  }, [secs]);

  return {
    screen,
    go,
    papers,
    activePaper,
    setActivePaperId,
    openPaper,
    createAndOpen,
    removePaper,
    editingQuestionId,
    questionForm,
    startAddQuestion,
    startEditQuestion,
    cancelQuestionForm,
    patchQuestionForm,
    saveQuestionForm,
    deleteQuestionAction,
    previewMode,
    tab,
    showWriteTab,
    showPreviewTab,
    setAnswerFor,
    insertSnippet,
    draftFor,
    setMarkScore,
    setMarkNote,
    saveMarksAction,
    reopenMarking,
    remarking,
    timedIdx,
    setTimedIdx,
    secs,
    timing,
    timedActive,
    toggleTimer,
    startTimed,
    finishTimed,
    prevQ,
    nextQ,
    clock,
  };
}

export type ExamPracticeState = ReturnType<typeof useExamPractice>;
