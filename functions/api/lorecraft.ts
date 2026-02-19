interface Env {
  OPENAI_API_KEY: string;
}

interface LoreCraftRequest {
  worldType: string;
  realityAnchor: string;
  allowedDeviations: string;
  motif?: string;
  extraContext?: string;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

function buildPrompt(body: LoreCraftRequest): string {
  const lines: string[] = [
    `Please generate a comprehensive worldbuilding verification report for the following world.`,
    ``,
    `**World Type:** ${body.worldType}`,
    ``,
    `**Reality Anchor** (rules that always hold):`,
    body.realityAnchor,
    ``,
    `**Allowed Deviations** (what breaks or bends the rules):`,
    body.allowedDeviations,
  ];

  if (body.motif?.trim()) {
    lines.push(``, `**Core Motif / Themes:** ${body.motif}`);
  }
  if (body.extraContext?.trim()) {
    lines.push(``, `**Additional Context:**`, body.extraContext);
  }

  lines.push(
    ``,
    `---`,
    ``,
    `Structure your report with the following sections (use markdown headers):`,
    ``,
    `## World Overview`,
    `A brief, evocative synthesis of the world's essence and feel.`,
    ``,
    `## Internal Logic Assessment`,
    `How coherently do the defined rules hold together? What's strong? What's fragile?`,
    ``,
    `## Key World Laws`,
    `The fundamental rules governing this world — list 5–7 as bullet points.`,
    ``,
    `## Potential Tensions & Paradoxes`,
    `Contradictions or unresolved questions the creator should address — list 3–5.`,
    ``,
    `## Narrative Opportunities`,
    `Rich story hooks and thematic possibilities this world naturally generates — list 4–6.`,
    ``,
    `## Worldbuilder's Checklist`,
    `Key questions to answer before writing in this world — list 5–8 as checkboxes (- [ ] …).`,
    ``,
    `## 🐱 LoreKit's Verdict`,
    `A brief in-character verdict from LoreKit the assistant cat — knowledgeable, a little witty, warm. End with a star rating out of 5 (e.g. ✦✦✦✦☆ 4/5 — Solid foundations, a few loose stones).`,
  );

  return lines.join('\n');
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

    const body = (await request.json()) as LoreCraftRequest;

    if (!body.worldType || !body.realityAnchor?.trim() || !body.allowedDeviations?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: worldType, realityAnchor, allowedDeviations.' }),
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
              'You are LoreKit, a wise and slightly mischievous assistant cat who serves as a worldbuilding guide for writers and creators. You are knowledgeable, insightful, and speak with elegant precision — not childish, not gothic. You write in well-structured markdown. Your verdicts are warm but honest.',
          },
          {
            role: 'user',
            content: buildPrompt(body),
          },
        ],
        max_tokens: 2200,
        temperature: 0.72,
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
