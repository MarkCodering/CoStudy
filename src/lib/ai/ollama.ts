import {
  AiError,
  EXTRACTION_SYSTEM_PROMPT,
  GRADE_SYSTEM_PROMPT,
  extractionUserPrompt,
  gradeUserPrompt,
  type AiDocument,
  type AiProvider,
  type ExtractedQuestion,
  type GradeSuggestion,
} from "@/lib/ai/types";

const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          num: { type: "string" },
          topic: { type: "string" },
          marks: { type: "integer" },
          prompt: { type: "string" },
        },
        required: ["num", "topic", "marks", "prompt"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const GRADE_SCHEMA = {
  type: "object",
  properties: { score: { type: "integer" }, note: { type: "string" } },
  required: ["score", "note"],
  additionalProperties: false,
};

interface OllamaResponse {
  message?: { content?: string };
  error?: string;
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

async function post(baseUrl: string, body: unknown, signal?: AbortSignal): Promise<OllamaResponse> {
  let response: Response;
  try {
    response = await fetch(endpoint(baseUrl, "/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new AiError(`Couldn't reach Ollama at ${baseUrl}. Is Ollama running?`, error);
  }
  const payload = (await response.json().catch(() => ({}))) as OllamaResponse;
  if (!response.ok) throw new AiError(payload.error || `Ollama returned HTTP ${response.status}.`);
  return payload;
}

function parseJson<T>(response: OllamaResponse): T {
  const content = response.message?.content;
  if (!content) throw new AiError("Ollama returned an empty response.");
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new AiError("Ollama did not return valid structured data. Try a newer instruction-tuned model.", error);
  }
}

async function pdfInput(document: AiDocument): Promise<{ text: string; images?: string[] }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  const bytes = Uint8Array.from(atob(document.base64), (char) => char.charCodeAt(0));
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (text) pages.push(`--- Page ${pageNumber} ---\n${text}`);
  }

  const text = pages.join("\n\n");
  if (text.length >= 200) return { text };

  const images: string[] = [];
  const pageLimit = Math.min(pdf.numPages, 12);
  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const unscaled = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / unscaled.width);
    const viewport = page.getViewport({ scale });
    const canvas = documentCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new AiError("This browser could not render the PDF.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.82).split(",")[1]);
  }
  return {
    text: `This PDF appears to be scanned. Read the attached page images.${pdf.numPages > pageLimit ? ` Only the first ${pageLimit} pages are attached.` : ""}`,
    images,
  };
}

function documentCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  return canvas;
}

export function createOllamaProvider(baseUrl: string, model: string): AiProvider {
  return {
    supportsDocuments: true,

    async testConnection(opts) {
      await post(baseUrl, { model, stream: false, messages: [{ role: "user", content: "Reply OK." }], options: { num_predict: 8 } }, opts?.signal);
    },

    async extractQuestions(document, opts) {
      let content = extractionUserPrompt();
      let images: string[] | undefined;
      if (document.mediaType === "application/pdf") {
        const input = await pdfInput(document);
        content += `\n\n${input.text}`;
        images = input.images;
      } else if (document.mediaType.startsWith("image/")) {
        images = [document.base64];
      } else {
        throw new AiError("Ollama question extraction supports PDF and image files.");
      }
      const response = await post(
        baseUrl,
        {
          model,
          stream: false,
          format: QUESTIONS_SCHEMA,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            { role: "user", content, ...(images ? { images } : {}) },
          ],
        },
        opts?.signal
      );
      return parseJson<{ questions: ExtractedQuestion[] }>(response).questions;
    },

    async suggestGrade(input, opts) {
      const response = await post(
        baseUrl,
        {
          model,
          stream: false,
          format: GRADE_SCHEMA,
          messages: [
            { role: "system", content: GRADE_SYSTEM_PROMPT },
            { role: "user", content: gradeUserPrompt(input) },
          ],
        },
        opts?.signal
      );
      const parsed = parseJson<GradeSuggestion>(response);
      return { score: Math.max(0, Math.min(input.marks, Math.round(parsed.score))), note: parsed.note };
    },
  };
}
