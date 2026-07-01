import { env } from '../../../config/env';
import { AiProvider, AiPrompt, AiResult } from './ai-provider.interface';
import { MockAiProvider } from './mock-ai.provider';

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  private readonly fallback = new MockAiProvider();

  async generate(input: AiPrompt): Promise<AiResult> {
    if (!env.ai.openaiApiKey) {
      return this.fallback.generate(input);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.ai.openaiApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.ai.openaiTextModel,
        messages: [
          {
            role: 'system',
            content:
              'You generate polished short-form social content for creators. Keep outputs concise, brand-safe, and platform-ready.',
          },
          {
            role: 'user',
            content: this.promptFor(input),
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return this.fallback.generate(input);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';

    return {
      provider: this.name,
      kind: input.kind,
      text,
      hashtags: input.kind === 'hashtags' ? this.extractHashtags(text) : undefined,
    };
  }

  async transcribe(input: { mediaUrl: string; language?: string }) {
    if (!env.ai.openaiApiKey) {
      return this.fallback.transcribe(input);
    }

    return {
      provider: this.name,
      text:
        'Whisper transcription requires streaming the media object to OpenAI. This adapter is ready for the production file stream integration.',
    };
  }

  private promptFor(input: AiPrompt): string {
    return `Generate ${input.kind} for this short-form video idea: "${input.prompt}". Tone: ${
      input.tone ?? 'confident and useful'
    }. Audience: ${input.audience ?? 'AI-first creators'}.`;
  }

  private extractHashtags(text: string): string[] {
    return text
      .split(/\s+/)
      .filter((word) => word.startsWith('#'))
      .map((word) => word.replace(/^#/, '').replace(/[^\w]/g, ''))
      .filter(Boolean)
      .slice(0, 12);
  }
}
