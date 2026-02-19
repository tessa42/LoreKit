interface Env {
  OPENAI_API_KEY: string;
}

interface SimulatorRequest {
  name: string;
  vibe?: string;
  worldHint?: string;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

const WORLDS = [
  'The Forgotten Archives',
  'The Neon Depths',
  'The Emberfall Kingdom',
  'The Drift Between Stars',
  'The Verdant Labyrinth',
];

function buildPrompt(body: SimulatorRequest): string {
  const worlds = WORLDS.join(', ');
  const worldLine = body.worldHint?.trim()
    ? `The visitor has a feeling they belong in **${body.worldHint}**.`
    : `Assign them to one of these worlds based on their vibe: ${worlds}.`;

  const vibeLine = body.vibe?.trim()
    ? `Their vibe: "${body.vibe}".`
    : 'They have revealed nothing about themselves — let the world surprise them.';

  return [
    `A wanderer named **${body.name}** has stepped through the LoreKit portal.`,
    vibeLine,
    worldLine,
    ``,
    `Write their character card (150–220 words) following this structure:`,
    ``,
    `1. **World & Title** — State the world and give them a specific, evocative title/role in that world.`,
    `2. **First Arrival** — Describe their first vivid moment stepping into this world. Make it cinematic.`,
    `3. **Gift & Shadow** — One remarkable ability or trait they possess; one secret burden they carry.`,
    `4. **The Prophecy** — End with a single-sentence prophecy or quest hook written in archaic style.`,
    ``,
    `Tone: mythic, poetic, confident. Make ${body.name} feel chosen. Keep it under 230 words.`,
    ``,
    `Also output on the very last line, separated by "---", the world name you assigned:`,
    `---`,
    `WORLD: [world name here]`,
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

    const body = (await request.json()) as SimulatorRequest;

    if (!body.name?.trim()) {
      return new Response(
        JSON.stringify({ error: 'A name is required to open the portal.' }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Sanitise name length
    const safeName = body.name.slice(0, 80);

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
              'You are LoreKit, a magical assistant cat who writes character cards for wanderers stepping through interdimensional portals. Your writing is mythic, evocative, and poetic — like a fantasy novel opening. You always make the visitor feel significant and special.',
          },
          {
            role: 'user',
            content: buildPrompt({ ...body, name: safeName }),
          },
        ],
        max_tokens: 500,
        temperature: 0.88,
      }),
    });

    const aiData = (await openaiRes.json()) as OpenAIResponse;

    if (!openaiRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service error.', details: aiData.error?.message }),
        { status: 502, headers: corsHeaders },
      );
    }

    const raw = aiData.choices?.[0]?.message?.content ?? '';

    // Extract world name from the last line
    const parts = raw.split('---');
    const storyPart = parts.slice(0, -1).join('---').trim() || raw.trim();
    const lastPart = parts[parts.length - 1] ?? '';
    const worldMatch = lastPart.match(/WORLD:\s*(.+)/);
    const world = worldMatch ? worldMatch[1].trim() : '';

    return new Response(JSON.stringify({ result: storyPart, world }), {
      status: 200,
      headers: corsHeaders,
    });
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
