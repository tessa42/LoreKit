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
  system:           string;
  user:             string;
  /** When provided, response text is parsed as JSON and returned as an object. */
  jsonSchema?:      Record<string, unknown>;
  model?:           LLMModel;
  /** Used only for Chat Completions models. Silently ignored for reasoning models. */
  temperature?:     number;
  maxTokens?:       number;
  /** For Responses API models only. Default: 'medium'. */
  reasoningEffort?: 'low' | 'medium' | 'high';
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
const TIMEOUT_MS       = 22_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Fetches a URL with an AbortController-based hard timeout.
 * AbortController cancels the fetch at the network level, which works reliably
 * in CF Workers (unlike Promise.race + setTimeout which may not fire during I/O).
 */
async function fetchText(
  url:  string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; rawText: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res     = await fetch(url, { ...init, signal: controller.signal });
    const rawText = await res.text();
    return { ok: res.ok, status: res.status, rawText };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LLMError('OpenAI request timed out (25 s).', 504);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
      input: [
        { role: 'developer', content: opts.system },
        { role: 'user',      content: opts.user   },
      ],
      text: {
        format:    { type: 'text' },
        verbosity: 'medium',
      },
      reasoning: { effort: opts.reasoningEffort ?? 'medium' },
      tools:     [],
      store:     true,
      include:   ['reasoning.encrypted_content'],
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

  // ── Fetch (AbortController timeout) ────────────────────────────────────────
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

// ─── Streaming (Responses API only) ───────────────────────────────────────────
/**
 * Makes a streaming Responses API call.
 * Returns a ReadableStream of text output deltas (response.output_text.delta).
 * Caller is responsible for heartbeats; only actual text content is yielded.
 */
export async function callLLMStream(
  apiKey: string,
  opts:   Pick<CallLLMOptions, 'system' | 'user' | 'model' | 'maxTokens' | 'reasoningEffort'>,
): Promise<ReadableStream<string>> {
  const model = opts.model ?? DEFAULTS.model;
  if (!RESPONSES_MODELS.has(model)) {
    throw new LLMError('callLLMStream only supports Responses API models', 500);
  }

  const reqBody: Record<string, unknown> = {
    model,
    input: [
      { role: 'developer', content: opts.system },
      { role: 'user',      content: opts.user   },
    ],
    text:      { format: { type: 'text' }, verbosity: 'medium' },
    reasoning: { effort: opts.reasoningEffort ?? 'medium' },
    tools:     [],
    store:     true,
    include:   ['reasoning.encrypted_content'],
    stream:    true,
  };
  if (opts.maxTokens) reqBody['max_output_tokens'] = opts.maxTokens;

  const res = await fetch(RESPONSES_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify(reqBody),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const e = (json['error'] ?? {}) as Record<string, unknown>;
      message = (e['message'] as string) || message;
    } catch {}
    throw new LLMError(message, res.status);
  }

  const body = res.body!;
  const dec  = new TextDecoder();
  let   buf  = '';

  return new ReadableStream<string>({
    start(controller) {
      const reader = body.getReader();

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }

            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';

            for (const raw of lines) {
              if (!raw.startsWith('data: ')) continue;
              const payload = raw.slice(6).trim();
              if (payload === '[DONE]') { controller.close(); return; }
              try {
                const evt = JSON.parse(payload) as Record<string, unknown>;
                const type = evt['type'] as string | undefined;
                // Accept any *.delta event that carries a string delta field.
                if (type?.includes('delta') && typeof evt['delta'] === 'string' && evt['delta']) {
                  controller.enqueue(evt['delta'] as string);
                }
              } catch { /* ignore malformed SSE lines */ }
            }
          }
        } catch (err) {
          controller.error(err);
        }
      })();
    },
    cancel() { body.cancel(); },
  });
}
