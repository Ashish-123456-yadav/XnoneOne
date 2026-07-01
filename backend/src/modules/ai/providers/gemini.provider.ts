import { env } from '../../../config/env';
import { AiProvider, AiPrompt, AiResult } from './ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly fallback = new MockAiProvider();

  async generate(input: AiPrompt): Promise<AiResult> {
    if (!env.ai.geminiApiKey) {
      return this.fallback.generate(input);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.ai.geminiTextModel}:generateContent?key=${env.ai.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate ${input.kind} for a NovaSocial AI creator post. Prompt: ${input.prompt}. Tone: ${
                    input.tone ?? 'premium and concise'
                  }.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return this.fallback.generate(input);
    }

    const json = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    return {
      provider: this.name,
      kind: input.kind,
      text,
      hashtags:
        input.kind === 'hashtags'
          ? text
              .split(/\s+/)
              .filter((word) => word.startsWith('#'))
              .map((word) => word.replace(/^#/, '').replace(/[^\w]/g, ''))
              .filter(Boolean)
              .slice(0, 12)
          : undefined,
    };
  }
}
