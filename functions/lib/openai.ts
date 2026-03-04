/**
 * Thin server-side wrapper around the OpenAI Responses API.
 *
 * The OPENAI_API_KEY is read from the Cloudflare environment and is NEVER
 * returned to the browser — all calls happen inside Pages Functions.
 *
 * Uses /v1/responses (not /v1/chat/completions) — required for GPT-5.2 family.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CallLLMOptions {
  system:      string;
  user:        string;
  /** When provided the API is called in JSON mode and the response is parsed. */
  jsonSchema?: Record<string, unknown>;
  model?:      'gpt-5.2-pro' | 'gpt-5-mini';
  maxTokens?:  number;
}

interface ResponseOutput {
  type:     string;
  content?: Array<{ type: string; text: string }>;
}

interface ResponsesAPIResponse {
  output?: ResponseOutput[];
  error?:  { message: string; code?: string };
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
  model:     'gpt-5.2-pro',
  maxTokens: 1_500,
} as const;

const OPENAI_URL = 'https://api.openai.com/v1/responses';

// ─── Overloads ────────────────────────────────────────────────────────────────
/**
 * Calls the OpenAI Responses API.
 *
 * • With `jsonSchema` → enables JSON mode; returns the parsed object.
 * • Without `jsonSchema` → returns the raw text string.
 *
 * Throws {@link LLMError} on HTTP or API-level failures.
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
  const body: Record<string, unknown> = {
    model:             opts.model    ?? DEFAULTS.model,
    max_output_tokens: opts.maxTokens ?? DEFAULTS.maxTokens,
    input: [
      { role: 'system', content: opts.system },
      { role: 'user',   content: opts.user   },
    ],
  };

  if (opts.jsonSchema) {
    body['text'] = { format: { type: 'json_object' } };
  }

  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new LLMError(`Network error reaching OpenAI: ${String(err)}`, 502);
  }

  const data = (await res.json()) as ResponsesAPIResponse;

  if (!res.ok) {
    throw new LLMError(
      data.error?.message ?? 'OpenAI returned an error.',
      res.status,
      data.error?.code,
    );
  }

  const msgOutput = data.output?.find(o => o.type === 'message');
  const content = msgOutput?.content?.[0]?.text ?? '';

  if (opts.jsonSchema) {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new LLMError('OpenAI returned malformed JSON.', 502);
    }
  }

  return content;
}
