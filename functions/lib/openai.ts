/**
 * Thin server-side wrapper around the OpenAI Chat Completions and Responses APIs.
 *
 * Model routing:
 * • gpt-4o / gpt-4o-mini  →  /v1/chat/completions  (Chat Completions)
 * • gpt-5.2 / gpt-5-mini  →  /v1/responses          (Responses API, reasoning)
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type LLMModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-5.2' | 'gpt-5-mini';

export interface CallLLMOptions {
  system:       string;
  user:         string;
  /** When provided, response text is parsed as JSON and returned as an object. */
  jsonSchema?:  Record<string, unknown>;
  model?:       LLMModel;
  /** Used only for Chat Completions models. Silently ignored for reasoning models. */
  temperature?: number;
  maxTokens?:   number;
}

// ─── Error class ──────────────────────────────────────────────────────────────
export class LLMError extends Error {
  constructor(
    message:              string,
    public readonly status: number,
    public readonly code?:  string,
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  model:       'gpt-4o'  as LLMModel,
  temperature: 0.3,
  maxTokens:   1_500,
} as const;

const COMPLETIONS_URL  = 'https://api.openai.com/v1/chat/completions';
const RESPONSES_URL    = 'https://api.openai.com/v1/responses';
const RESPONSES_MODELS = new Set<string>(['gpt-5.2', 'gpt-5-mini']);

// ─── Overloads ────────────────────────────────────────────────────────────────
export async function callLLM(
  apiKey: string,
  opts:   CallLLMOptions & { jsonSchema: Record<string, unknown> },
): Promise<unknown>;

export async function callLLM(
  apiKey: string,
  opts:   Omit<CallLLMOptions, 'jsonSchema'> & { jsonSchema?: undefined },
): Promise<string>;

export async function callLLM(
  apiKey: string,
  opts:   CallLLMOptions,
): Promise<string | unknown> {
  const model        = opts.model ?? DEFAULTS.model;
  const useResponses = RESPONSES_MODELS.has(model);

  // ── Build request body ─────────────────────────────────────────────────────
  let reqBody: Record<string, unknown>;

  if (useResponses) {
    reqBody = {
      model,
      input: [{
        type:    'message',
        role:    'user',
        content: [{ type: 'input_text', text: opts.user }],
      }],
      instructions: opts.system,
      text:         { format: { type: 'text' } },
      reasoning:    { effort: 'medium' },
    };
    if (opts.maxTokens) reqBody['max_output_tokens'] = opts.maxTokens;
  } else {
    reqBody = {
      model,
      temperature: opts.temperature ?? DEFAULTS.temperature,
      max_tokens:  opts.maxTokens   ?? DEFAULTS.maxTokens,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.user   },
      ],
    };
    if (opts.jsonSchema) reqBody['response_format'] = { type: 'json_object' };
  }

  // ── Fetch with 25 s abort ──────────────────────────────────────────────────
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch(useResponses ? RESPONSES_URL : COMPLETIONS_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body:   JSON.stringify(reqBody),
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === 'AbortError'
      ? 'OpenAI request timed out (25 s).'
      : `Network error reaching OpenAI: ${String(err)}`;
    throw new LLMError(msg, 504);
  } finally {
    clearTimeout(timer);
  }

  // ── Parse response ─────────────────────────────────────────────────────────
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    const e = (data['error'] ?? {}) as Record<string, unknown>;
    throw new LLMError(
      (e['message'] as string) || `HTTP ${res.status}`,
      res.status,
      e['code'] as string | undefined,
    );
  }

  let content: string;
  if (useResponses) {
    const output     = (data['output']  as Array<Record<string, unknown>> | undefined) ?? [];
    const msgItem    = output.find(o => o['type'] === 'message');
    const contentArr = (msgItem?.['content'] as Array<Record<string, unknown>> | undefined) ?? [];
    const textItem   = contentArr.find(c => c['type'] === 'output_text') ?? contentArr[0];
    content          = (textItem?.['text'] as string) ?? '';
  } else {
    const choices = (data['choices'] as Array<{ message: { content: string } }> | undefined) ?? [];
    content       = choices[0]?.message?.content ?? '';
  }

  if (opts.jsonSchema) {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new LLMError('OpenAI returned malformed JSON.', 502);
    }
  }

  return content;
}
