import Anthropic from "@anthropic-ai/sdk";
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

function textOf(message: Anthropic.Message): string {
  const block = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!block) throw new AiError("Claude's response had no text content to read.");
  return block.text;
}

function guardRefusal(message: Anthropic.Message) {
  if (message.stop_reason === "refusal") {
    throw new AiError("Claude declined this request (safety filter). Try rephrasing, or mark it yourself.");
  }
}

export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return {
    supportsDocuments: true,

    async testConnection(opts?: AiCallOptions) {
      try {
        await client.messages.create(
          { model, max_tokens: 8, messages: [{ role: "user", content: "Say OK." }] },
          { signal: opts?.signal }
        );
      } catch (err) {
        throw new AiError(describeError(err), err);
      }
    },

    async extractQuestions(pdfBase64, fileName, opts) {
      try {
        const message = await client.messages.create(
          {
            model,
            max_tokens: 8000,
            system: EXTRACTION_SYSTEM_PROMPT,
            output_config: { format: { type: "json_schema", schema: QUESTIONS_SCHEMA } },
            messages: [
              {
                role: "user",
                content: [
                  { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
                  { type: "text", text: extractionUserPrompt() + ` (source file: ${fileName})` },
                ],
              },
            ],
          },
          { signal: opts?.signal }
        );
        guardRefusal(message);
        const parsed = JSON.parse(textOf(message)) as { questions: ExtractedQuestion[] };
        return parsed.questions;
      } catch (err) {
        if (err instanceof AiError) throw err;
        throw new AiError(describeError(err), err);
      }
    },

    async suggestGrade(input, opts) {
      try {
        const message = await client.messages.create(
          {
            model,
            max_tokens: 500,
            system: GRADE_SYSTEM_PROMPT,
            output_config: { format: { type: "json_schema", schema: GRADE_SCHEMA } },
            messages: [{ role: "user", content: gradeUserPrompt(input) }],
          },
          { signal: opts?.signal }
        );
        guardRefusal(message);
        const parsed = JSON.parse(textOf(message)) as GradeSuggestion;
        return { score: Math.max(0, Math.min(input.marks, Math.round(parsed.score))), note: parsed.note };
      } catch (err) {
        if (err instanceof AiError) throw err;
        throw new AiError(describeError(err), err);
      }
    },
  };
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Invalid Anthropic API key.";
  if (err instanceof Anthropic.PermissionDeniedError) return "This API key can't access that model.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by Anthropic — try again shortly.";
  if (err instanceof Anthropic.NotFoundError) return "Unknown model ID.";
  if (err instanceof Anthropic.APIError) return `Anthropic API error: ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}
