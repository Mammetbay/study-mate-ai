import { AICapability, AIModel, ProviderId } from '../../types/ai';

/**
 * Providers do not return clean "this model is stt / vision / chat" metadata
 * (except OpenRouter). These functions turn each provider's raw /models
 * response into classified `AIModel[]`, using endpoint metadata where it exists
 * and id-based heuristics where it does not.
 *
 * Heuristics are best-effort: a new model family the patterns don't recognise
 * will still show up under "chat" as long as it looks like a text model.
 */

/** Raw item shape from an OpenAI-compatible /models endpoint. */
export interface RawOpenAIModel {
  id: string;
  // OpenRouter-only extras:
  name?: string;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

/** Raw item shape from the Gemini /models endpoint. */
export interface RawGeminiModel {
  name: string; // e.g. "models/gemini-2.0-flash"
  displayName?: string;
  supportedGenerationMethods?: string[];
}

function toLabel(id: string, fallbackName?: string): string {
  if (fallbackName) return fallbackName;
  const base = id.includes('/') ? id.split('/').pop()! : id;
  return base
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => (/^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function make(id: string, capabilities: AICapability[], name?: string): AIModel {
  return { id, label: toLabel(id, name), capabilities };
}

// --- Groq -----------------------------------------------------------------

const GROQ_STT = /whisper|distil-whisper/i;
const GROQ_VISION = /vision|llava|llama-4|scout|maverick|-vl\b|qwen.*vl/i;
// Non-conversational models we never want to offer as chat/vision/stt.
const GROQ_EXCLUDE = /tts|guard|playai|prompt-guard|embedding/i;

function classifyGroq(models: RawOpenAIModel[]): AIModel[] {
  const result: AIModel[] = [];
  for (const m of models) {
    const id = m.id;
    if (GROQ_STT.test(id)) {
      result.push(make(id, ['stt']));
      continue;
    }
    if (GROQ_EXCLUDE.test(id)) continue;
    const caps: AICapability[] = GROQ_VISION.test(id) ? ['vision', 'chat'] : ['chat'];
    result.push(make(id, caps));
  }
  return result;
}

// --- OpenAI ---------------------------------------------------------------

const OPENAI_STT = /whisper|transcribe/i;
const OPENAI_EXCLUDE =
  /tts|dall-e|embedding|moderation|image|realtime|audio|davinci|babbage|codex|search|computer-use/i;
const OPENAI_VISION = /gpt-4o|gpt-4\.1|chatgpt-4o|gpt-4-turbo|gpt-4-vision|^o1|^o3|^o4/i;
const OPENAI_CHAT = /^gpt-|^o1|^o3|^o4|^chatgpt/i;

function classifyOpenAI(models: RawOpenAIModel[]): AIModel[] {
  const result: AIModel[] = [];
  for (const m of models) {
    const id = m.id;
    if (OPENAI_STT.test(id)) {
      result.push(make(id, ['stt']));
      continue;
    }
    if (OPENAI_EXCLUDE.test(id)) continue;
    if (!OPENAI_CHAT.test(id)) continue;
    const caps: AICapability[] = OPENAI_VISION.test(id) ? ['vision', 'chat'] : ['chat'];
    result.push(make(id, caps));
  }
  return result;
}

// --- OpenRouter -----------------------------------------------------------
// OpenRouter gives real modality metadata, so we trust it. STT is intentionally
// left empty: OpenRouter proxies chat completions only and has no Whisper-style
// /audio/transcriptions endpoint, so audio-input models still can't transcribe
// through our stt flow.

function classifyOpenRouter(models: RawOpenAIModel[]): AIModel[] {
  const result: AIModel[] = [];
  for (const m of models) {
    const input = m.architecture?.input_modalities ?? [];
    const output = m.architecture?.output_modalities ?? [];
    // Skip image/audio-only generators — must be able to output text.
    if (output.length > 0 && !output.includes('text')) continue;
    const caps: AICapability[] = input.includes('image') ? ['vision', 'chat'] : ['chat'];
    result.push(make(m.id, caps, m.name));
  }
  return result;
}

// --- Gemini ---------------------------------------------------------------

const GEMINI_EXCLUDE = /embedding|aqa|imagen|veo|tts|image-generation/i;

function classifyGemini(models: RawGeminiModel[]): AIModel[] {
  const result: AIModel[] = [];
  for (const m of models) {
    const id = m.name.replace(/^models\//, '');
    if (GEMINI_EXCLUDE.test(id)) continue;
    if (!m.supportedGenerationMethods?.includes('generateContent')) continue;
    // Gemini generateContent models are multimodal (accept image input).
    result.push(make(id, ['vision', 'chat'], m.displayName));
  }
  return result;
}

/** Classify an OpenAI-compatible /models payload for the given provider. */
export function classifyOpenAICompatible(
  providerId: ProviderId,
  models: RawOpenAIModel[]
): AIModel[] {
  switch (providerId) {
    case 'groq':
      return classifyGroq(models);
    case 'openai':
      return classifyOpenAI(models);
    case 'openrouter':
      return classifyOpenRouter(models);
    default:
      return [];
  }
}

export { classifyGemini };
