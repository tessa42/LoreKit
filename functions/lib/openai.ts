/**
 * Thin server-side wrapper around the OpenAI Chat Completions API.
 *
 * The OPENAI_API_KEY is read from the Cloudflare environment and is NEVER
 * returned to the browser — all calls happen inside Pages Functions.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CallLLMOptions {
  system:      string;
  user:        string;
  /** When provided the API is called in JSON mode and the response is parsed. */
  jsonSchema?: Record<string, unknown>;
  model?:      'gpt-4o' | 'gpt-4o-mini';
  temperature?:number;
  maxTokens?:  number;
}

interface OpenAIMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message: { content: string };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?:   { message: string; code?: string };
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

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  model:       'gpt-4o',
  temperature: 0.3,
  maxTokens:   1_500,
} as const;

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ─── Overloads ────────────────────────────────────────────────────────────────
/**
 * Calls the OpenAI Chat Completions API.
 *
 * • With `jsonSchema` → enables JSON mode; returns the parsed object.
 * • Without `jsonSchema` → returns the raw text string.
 *
 * Throws {@link LLMError} on HTTP or API-level failures.
 *
 * @example — plain text
 *   const story = await callLLM(env.OPENAI_API_KEY, { system, user });
 *
 * @example — structured JSON
 *   const report = await callLLM(env.OPENAI_API_KEY, { system, user, jsonSchema: { ... } });
 */
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
  const messages: OpenAIMessage[] = [
    { role: 'system', content: opts.system },
    { role: 'user',   content: opts.user   },
  ];

  const body: Record<string, unknown> = {
    model:       opts.model       ?? DEFAULTS.model,
    temperature: opts.temperature ?? DEFAULTS.temperature,
    max_tokens:  opts.maxTokens   ?? DEFAULTS.maxTokens,
    messages,
  };

  if (opts.jsonSchema) {
    body['response_format'] = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body:   JSON.stringify(body),
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

  const data = (await res.json()) as OpenAIResponse;

  if (!res.ok) {
    throw new LLMError(
      data.error?.message ?? 'OpenAI returned an error.',
      res.status,
      data.error?.code,
    );
  }

  const content = data.choices?.[0]?.message?.content ?? '';

  if (opts.jsonSchema) {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new LLMError('OpenAI returned malformed JSON.', 502);
    }
  }

  return content;
}
