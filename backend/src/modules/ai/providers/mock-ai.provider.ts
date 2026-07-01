import { AiProvider, AiPrompt, AiResult } from './ai-provider.interface';

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  async generate(input: AiPrompt): Promise<AiResult> {
    const base = input.prompt.replace(/\s+/g, ' ').trim();

    if (input.kind === 'hashtags') {
      return {
        provider: this.name,
        kind: input.kind,
        text: '#NovaSocial #AIShorts #CreatorTools #MadeWithAI',
        hashtags: ['NovaSocial', 'AIShorts', 'CreatorTools', 'MadeWithAI'],
      };
    }

    const templates = {
      caption: `A sharp creator caption for: ${base}.`,
      title: `AI Creator Sprint: ${base.slice(0, 42)}`,
      description: `A concise short-form description that frames the hook, value, and creator CTA for "${base}".`,
    };

    return {
      provider: this.name,
      kind: input.kind,
      text: templates[input.kind],
    };
  }

  async transcribe(input: { mediaUrl: string; language?: string }) {
    return {
      provider: this.name,
      text: `Mock transcript for ${input.mediaUrl}${input.language ? ` in ${input.language}` : ''}.`,
    };
  }
}
