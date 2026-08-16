// Provider-agnostic surface the app calls into. Each provider file
// implements this against its own SDK/API; src/lib/ai/index.ts picks one
// based on the user's settings. Every call is made directly from this
// device to the provider's API with the user's own credentials — there is
// no CoStudy server in the loop.

export interface ExtractedQuestion {
  num: string;
  topic: string;
  marks: number;
  prompt: string;
}

export interface GradeSuggestion {
  score: number;
  note: string;
}

export interface AiCallOptions {
  /** Abort an in-flight call (e.g. the user navigates away or cancels). */
  signal?: AbortSignal;
}

export interface AiDocument {
  base64: string;
  fileName: string;
  mediaType: string;
}

/** Thrown for any provider failure — network, auth, refusal, bad response shape. */
export class AiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "AiError";
  }
}

export interface AiProvider {
  /** Whether this provider can read a PDF/image directly (question extraction needs this). */
  supportsDocuments: boolean;
  /** A cheap call that only checks the key/model/server are reachable and valid. */
  testConnection(opts?: AiCallOptions): Promise<void>;
  /** Read a PDF or image paper and split it into questions. */
  extractQuestions(document: AiDocument, opts?: AiCallOptions): Promise<ExtractedQuestion[]>;
  /** Suggest a score and a short note for one answered question. */
  suggestGrade(input: { prompt: string; answer: string; marks: number }, opts?: AiCallOptions): Promise<GradeSuggestion>;
}

export const EXTRACTION_SYSTEM_PROMPT =
  "You are reading a scanned or digital exam paper. Split it into individual numbered questions " +
  "(including sub-parts like 1a/1b as separate entries). For each: give its printed number, a short " +
  "topic label (2-4 words, the mathematical/subject concept it tests), its mark allocation as an " +
  "integer, and the full question prompt. Write every formula as LaTeX, inline as $...$ and displayed " +
  "equations as $$...$$. Preserve the question's own wording — do not paraphrase or solve it.";

export const GRADE_SYSTEM_PROMPT =
  "You are marking one exam answer against the question it responds to. Award an integer score out of " +
  "the marks available, and write one short note (1-2 sentences) on what was right or wrong, in the " +
  "second person, addressed to the student. Be specific about where marks were lost.";

export function extractionUserPrompt(): string {
  return "Extract every question from this paper as structured data, per the system instructions.";
}

export function gradeUserPrompt(input: { prompt: string; answer: string; marks: number }): string {
  return (
    `Question (${input.marks} marks):\n${input.prompt}\n\n` +
    `Student's answer:\n${input.answer || "(left blank)"}\n\n` +
    "Score it and explain why."
  );
}
