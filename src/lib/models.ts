// The app's real data model. Everything here is created by the person
// using the app — there is no seed/fixture data shipped with CoStudy.

export type PaperKind = "Past exam" | "Mock" | "Custom";

export interface QuestionRecord {
  id: string;
  /** Question number as printed on the paper, e.g. "1", "1a", "B2". User-entered. */
  num: string;
  topic: string;
  marks: number;
  /** Markdown-lite + LaTeX ($…$, $$…$$). */
  prompt: string;
  /** The learner's working, same markup as prompt. */
  answer: string;
  /** Self-assigned marks once the paper has been marked. Absent until then. */
  score?: number;
  /** A short personal note on what went wrong / what to remember. */
  note?: string;
}

export interface PaperRecord {
  id: string;
  title: string;
  course: string;
  kind: PaperKind;
  /** Name of the file picked in "Add a paper", kept for reference only. */
  fileName?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp — bumped on any edit
  gradedAt?: string; // ISO timestamp — set once marks are saved
  questions: QuestionRecord[];
}

export function totalMarks(paper: PaperRecord): number {
  return paper.questions.reduce((sum, q) => sum + q.marks, 0);
}

export function totalScore(paper: PaperRecord): number | null {
  if (!paper.questions.length || paper.questions.some((q) => q.score == null)) return null;
  return paper.questions.reduce((sum, q) => sum + (q.score ?? 0), 0);
}

export function isGraded(paper: PaperRecord): boolean {
  return !!paper.questions.length && paper.questions.every((q) => q.score != null);
}

export function answeredCount(paper: PaperRecord): number {
  return paper.questions.filter((q) => q.answer.trim().length > 0).length;
}
