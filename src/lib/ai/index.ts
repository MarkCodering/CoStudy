import { createAnthropicProvider } from "@/lib/ai/anthropic";
import { createOllamaProvider } from "@/lib/ai/ollama";
import { createOpenAiProvider } from "@/lib/ai/openai";
import { AiError, type AiProvider } from "@/lib/ai/types";
import type { AiSettings } from "@/lib/settings";

export function createAiProvider(settings: AiSettings): AiProvider {
  switch (settings.provider) {
    case "anthropic":
      if (!settings.anthropicApiKey.trim()) throw new AiError("Add an Anthropic API key in Settings first.");
      if (!settings.anthropicModel.trim()) throw new AiError("Choose an Anthropic model in Settings first.");
      return createAnthropicProvider(settings.anthropicApiKey.trim(), settings.anthropicModel.trim());
    case "openai":
      if (!settings.openaiApiKey.trim()) throw new AiError("Add an OpenAI API key in Settings first.");
      if (!settings.openaiModel.trim()) throw new AiError("Choose an OpenAI model in Settings first.");
      return createOpenAiProvider(settings.openaiApiKey.trim(), settings.openaiModel.trim());
    case "ollama":
      if (!settings.ollamaBaseUrl.trim()) throw new AiError("Add the Ollama server URL in Settings first.");
      if (!settings.ollamaModel.trim()) throw new AiError("Choose an Ollama model in Settings first.");
      return createOllamaProvider(settings.ollamaBaseUrl.trim(), settings.ollamaModel.trim());
  }
}
