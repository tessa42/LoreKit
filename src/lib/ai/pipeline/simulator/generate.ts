import { getAnthropicClient, MODELS } from '@/lib/ai/anthropic';
import { loadContext } from './load-context';
import type { NormalizedSimulatorInput } from './normalize';

export async function generateSimulation(input: NormalizedSimulatorInput): Promise<string> {
  const client = getAnthropicClient();
  const systemPrompt = loadContext(input.mood, input.genre);

  const message = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 600,
    temperature: 1.0,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `캐릭터 이름: ${input.name}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');

  return block.text;
}
