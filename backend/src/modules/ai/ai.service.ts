import { BadRequestException, Injectable } from '@nestjs/common';
import { assertOptionalString, assertRequiredString } from '../../common/pipes/pagination';
import { env } from '../../config/env';
import { AiGenerationKind, AiProvider } from './providers/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class AiService {
  private readonly providers: Record<string, AiProvider> = {
    mock: new MockAiProvider(),
    openai: new OpenAiProvider(),
    gemini: new GeminiProvider(),
  };

  async generate(body: Record<string, unknown>) {
    const kind = this.kind(body.kind);
    const provider = this.provider(typeof body.provider === 'string' ? body.provider : env.ai.provider);
    const result = await provider.generate({
      kind,
      prompt: assertRequiredString(body.prompt, 'prompt', 4, 2000),
      tone: assertOptionalString(body.tone, 'tone', 80) || undefined,
      audience: assertOptionalString(body.audience, 'audience', 120) || undefined,
    });

    return {
      ...result,
      usage: {
        cached: provider.name === 'mock',
        billable: provider.name !== 'mock',
      },
    };
  }

  async generateBatch(body: Record<string, unknown>) {
    const prompt = assertRequiredString(body.prompt, 'prompt', 4, 2000);
    const providerName = typeof body.provider === 'string' ? body.provider : env.ai.provider;

    const [caption, title, description, hashtags] = await Promise.all([
      this.generate({ prompt, provider: providerName, kind: 'caption', tone: body.tone, audience: body.audience }),
      this.generate({ prompt, provider: providerName, kind: 'title', tone: body.tone, audience: body.audience }),
      this.generate({ prompt, provider: providerName, kind: 'description', tone: body.tone, audience: body.audience }),
      this.generate({ prompt, provider: providerName, kind: 'hashtags', tone: body.tone, audience: body.audience }),
    ]);

    return { caption, title, description, hashtags };
  }

  async transcribe(body: Record<string, unknown>) {
    const provider = this.provider(typeof body.provider === 'string' ? body.provider : 'openai');
    const mediaUrl = assertRequiredString(body.mediaUrl, 'mediaUrl', 8, 1000);

    if (!provider.transcribe) {
      return this.providers.mock.transcribe?.({ mediaUrl, language: assertOptionalString(body.language, 'language', 20) });
    }

    return provider.transcribe({ mediaUrl, language: assertOptionalString(body.language, 'language', 20) || undefined });
  }

  private provider(name: string): AiProvider {
    return this.providers[name] ?? this.providers.mock;
  }

  private kind(value: unknown): AiGenerationKind {
    if (value === 'caption' || value === 'title' || value === 'description' || value === 'hashtags') {
      return value;
    }

    throw new BadRequestException('kind must be caption, title, description, or hashtags');
  }
}
