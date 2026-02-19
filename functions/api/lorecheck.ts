interface Env {
  OPENAI_API_KEY: string;
}

interface LoreCheckRequest {
  worldText: string;
  worldName?: string;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

function buildPrompt(body: LoreCheckRequest): string {
  const name = body.worldName?.trim() ? `"${body.worldName}"` : 'the provided world';

  return [
    `Analyse the following worldbuilding passage for ${name}.`,
    ``,
    `---`,
    body.worldText,
    `---`,
    ``,
    `Run a **Quick Scan** and perform a thorough internal evaluation across these layers:`,
    `internal consistency, cause-and-effect logic, societal plausibility, physical/magical rule coherence,`,
    `and narrative sustainability. Do NOT ask the user to pick categories — evaluate all layers automatically.`,
    ``,
    `Then surface exactly **3–5 key plausibility tensions** — the most important issues only.`,
    ``,
    `For each tension use this format:`,
    ``,
    `### Tension N: [Short descriptive name]`,
    `**The issue:** …`,
    `**Why it matters:** …`,
    `**Suggested resolution:** …`,
    ``,
    `After listing all tensions, add:`,
    ``,
    `## Consistency Score`,
    `Give an overall score out of 10 with a one-sentence explanation.`,
    `Format: **X / 10** — [explanation]`,
    ``,
    `## 🐱 LoreKit's Take`,
    `A brief, in-character note from LoreKit the assistant cat — witty, constructive, never dismissive.`,
    `Acknowledge what's working well before diving into what needs attention.`,
  ].join('\n');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    if (!env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing API key.' }),
        { status: 500, headers: corsHeaders },
      );
    }

    const body = (await request.json()) as LoreCheckRequest;

    if (!body.worldText?.trim() || body.worldText.trim().length < 30) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least a short world description to scan.' }),
        { status: 400, headers: corsHeaders },
      );
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are LoreKit, a wise and slightly mischievous assistant cat who specialises in worldbuilding consistency analysis. You are thorough, precise, and you write in well-structured markdown. Your tone is knowledgeable with a faint feline wit — helpful and encouraging, never harsh.',
          },
          {
            role: 'user',
            content: buildPrompt(body),
          },
        ],
        max_tokens: 1800,
        temperature: 0.65,
      }),
    });

    const aiData = (await openaiRes.json()) as OpenAIResponse;

    if (!openaiRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service error.', details: aiData.error?.message }),
        { status: 502, headers: corsHeaders },
      );
    }

    const result = aiData.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ result }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error.', details: String(err) }),
      { status: 500, headers: corsHeaders },
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
