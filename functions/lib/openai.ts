/**
 * Thin server-side wrapper around the OpenAI Responses API.
 *
 * The OPENAI_API_KEY is read from the Cloudflare environment and is NEVER
 * returned to the browser — all calls happen inside Pages Functions.
 *
 * gpt-5.2-pro and gpt-5-mini require /v1/responses (not /v1/chat/completions).
 * Temperature is not supported for these models.
 * For gpt-5-mini, pass reasoning: { effort: 'none' } to disable thinking overhead.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CallLLMOptions {
  system:      string;
  user:        string;
  /** When provided the API is called in JSON mode and the response is parsed. */
  jsonSchema?: Record<string, unknown>;
  model?:      'gpt-5.2-pro' | 'gpt-5-mini';
  maxTokens?:  number;
  /** Controls reasoning depth. Use { effort: 'none' } to disable thinking overhead for gpt-5-mini. */
  reasoning?:  { effort: 'none' | 'low' | 'medium' | 'high' };
}

interface ResponseOutputContent {
  type:  string;
  text?: string;
}

interface ResponseOutputItem {
  type:     string;
  content?: ResponseOutputContent[];
}

interface ResponsesAPIResponse {
  status?:           string;
  incomplete_details?: { reason?: string };
  output?:           ResponseOutputItem[];
  error?:            { message: string; code?: string };
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
  const model   = opts.model ?? DEFAULTS.model;
  const isMini  = model === 'gpt-5-mini';

  const body: Record<string, unknown> = {
    model,
    input: [
      {
        role:    'developer',
        content: [{ type: 'input_text', text: opts.system }],
      },
      {
        role:    'user',
        content: [{ type: 'input_text', text: opts.user }],
      },
    ],
    max_output_tokens: opts.maxTokens ?? DEFAULTS.maxTokens,
    reasoning:         opts.reasoning ?? (isMini ? { effort: 'medium' } : {}),
    store:             true,
    stream:            false,
  };

  if (opts.jsonSchema) {
    body['text'] = isMini
      ? { format: { type: 'json_object' }, verbosity: 'medium' }
      : { format: { type: 'json_object' } };
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
    throw new LLMError(`Network error reaching OpenAI: ${String(err)}`, 500);
  }

  let data: ResponsesAPIResponse;
  try {
    data = (await res.json()) as ResponsesAPIResponse;
  } catch {
    throw new LLMError('OpenAI returned a non-JSON response.', 500);
  }

  if (!res.ok) {
    throw new LLMError(
      data.error?.message ?? 'OpenAI returned an error.',
      res.status,
      data.error?.code,
    );
  }

  if (data.status === 'incomplete') {
    const reason = data.incomplete_details?.reason ?? 'max_output_tokens';
    throw new LLMError(
      `Response was cut off (${reason}). Try again or reduce your input.`,
      500,
    );
  }

  const msgOutput   = data.output?.find(o => o.type === 'message');
  const textContent = msgOutput?.content?.find(c => c.type === 'output_text');
  const content     = textContent?.text ?? '';

  if (opts.jsonSchema) {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new LLMError('OpenAI returned malformed JSON.', 500);
    }
  }

  return content;
}
