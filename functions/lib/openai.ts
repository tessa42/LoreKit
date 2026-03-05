/**
 * Thin server-side wrapper around the OpenAI Chat Completions and Responses APIs.
 *
 * Model routing:
 * • gpt-4o / gpt-4o-mini  →  /v1/chat/completions  (Chat Completions)
 * • gpt-5.2 / gpt-5-mini  →  /v1/responses          (Responses API)
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
const TIMEOUT_MS       = 23_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Races a fetch+body-read against a hard timeout (works in CF Workers). */
async function fetchText(
  url:  string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; rawText: string }> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new LLMError('OpenAI request timed out (23 s).', 504)),
      TIMEOUT_MS,
    ),
  );

  const fetchPromise = fetch(url, init).then(async (res) => ({
    ok:      res.ok,
    status:  res.status,
    rawText: await res.text(),
  }));

  return Promise.race([fetchPromise, timeoutPromise]);
}

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

  // ── Fetch (with timeout via Promise.race) ──────────────────────────────────
  let ok: boolean, status: number, rawText: string;
  try {
    ({ ok, status, rawText } = await fetchText(
      useResponses ? RESPONSES_URL : COMPLETIONS_URL,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${apiKey}`,
        },
        body: JSON.stringify(reqBody),
      },
    ));
  } catch (err) {
    if (err instanceof LLMError) throw err;
    throw new LLMError(`Network error reaching OpenAI: ${String(err)}`, 502);
  }

  // ── Parse JSON ─────────────────────────────────────────────────────────────
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    throw new LLMError(
      `OpenAI returned non-JSON (HTTP ${status}): ${rawText.slice(0, 150)}`,
      status || 502,
    );
  }

  if (!ok) {
    const e = (data['error'] ?? {}) as Record<string, unknown>;
    throw new LLMError(
      (e['message'] as string) || `HTTP ${status}`,
      status,
      e['code'] as string | undefined,
    );
  }

  // ── Extract text content ───────────────────────────────────────────────────
  let content: string;
  if (useResponses) {
    const output     = (data['output'] as Array<Record<string, unknown>> | undefined) ?? [];
    const msgItem    = output.find(o => o['type'] === 'message');
    if (!msgItem) {
      const types = output.map(o => String(o['type'])).join(', ') || 'none';
      throw new LLMError(`Responses API: no message in output (found: ${types})`, 502);
    }
    const contentArr = (msgItem['content'] as Array<Record<string, unknown>> | undefined) ?? [];
    const textItem   = contentArr.find(c => c['type'] === 'output_text') ?? contentArr[0];
    content          = (textItem?.['text'] as string) ?? '';
    if (!content) {
      throw new LLMError(`Responses API: empty text (${contentArr.length} content items)`, 502);
    }
  } else {
    const choices = (data['choices'] as Array<{ message: { content: string } }> | undefined) ?? [];
    content       = choices[0]?.message?.content ?? '';
  }

  // ── Parse JSON response ────────────────────────────────────────────────────
  if (opts.jsonSchema) {
    const cleaned = content
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();
    try {
      return JSON.parse(cleaned) as unknown;
    } catch {
      throw new LLMError(`OpenAI returned malformed JSON. Preview: ${cleaned.slice(0, 120)}`, 502);
    }
  }

  return content;
}
