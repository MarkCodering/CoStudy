import OpenAI from "openai";
import {
  AiError,
  EXTRACTION_SYSTEM_PROMPT,
  GRADE_SYSTEM_PROMPT,
  extractionUserPrompt,
  gradeUserPrompt,
  type AiCallOptions,
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
  properties: {
    score: { type: "integer" },
    note: { type: "string" },
  },
  required: ["score", "note"],
  additionalProperties: false,
};

export function createOpenAiProvider(apiKey: string, model: string): AiProvider {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  return {
    supportsDocuments: true,

    async testConnection(opts?: AiCallOptions) {
      try {
        await client.responses.create(
          { model, input: [{ role: "user", content: "Say OK." }], max_output_tokens: 16 },
          { signal: opts?.signal }
        );
      } catch (err) {
        throw new AiError(describeError(err), err);
      }
    },

    async extractQuestions(pdfBase64, fileName, opts) {
      try {
        const response = await client.responses.create(
          {
            model,
            instructions: EXTRACTION_SYSTEM_PROMPT,
            text: { format: { type: "json_schema", name: "extracted_questions", schema: QUESTIONS_SCHEMA, strict: true } },
            input: [
              {
                role: "user",
                content: [
                  { type: "input_file", filename: fileName, file_data: `data:application/pdf;base64,${pdfBase64}` },
                  { type: "input_text", text: extractionUserPrompt() },
                ],
              },
            ],
          },
          { signal: opts?.signal }
        );
        const parsed = JSON.parse(response.output_text) as { questions: ExtractedQuestion[] };
        return parsed.questions;
      } catch (err) {
        throw new AiError(describeError(err), err);
      }
    },

    async suggestGrade(input, opts) {
      try {
        const response = await client.responses.create(
          {
            model,
            instructions: GRADE_SYSTEM_PROMPT,
            text: { format: { type: "json_schema", name: "grade_suggestion", schema: GRADE_SCHEMA, strict: true } },
            input: [{ role: "user", content: gradeUserPrompt(input) }],
          },
          { signal: opts?.signal }
        );
        const parsed = JSON.parse(response.output_text) as GradeSuggestion;
        return { score: Math.max(0, Math.min(input.marks, Math.round(parsed.score))), note: parsed.note };
      } catch (err) {
        throw new AiError(describeError(err), err);
      }
    },
  };
}

function describeError(err: unknown): string {
  if (err instanceof OpenAI.AuthenticationError) return "Invalid OpenAI API key.";
  if (err instanceof OpenAI.PermissionDeniedError) return "This API key can't access that model.";
  if (err instanceof OpenAI.RateLimitError) return "Rate limited by OpenAI — try again shortly.";
  if (err instanceof OpenAI.NotFoundError) return "Unknown model ID.";
  if (err instanceof OpenAI.APIError) return `OpenAI API error: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}
