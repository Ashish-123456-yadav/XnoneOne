export type AiGenerationKind = 'caption' | 'title' | 'description' | 'hashtags';

export interface AiPrompt {
  kind: AiGenerationKind;
  prompt: string;
  tone?: string;
  audience?: string;
}

export interface AiResult {
  provider: string;
  kind: AiGenerationKind;
  text: string;
  hashtags?: string[];
}

export interface AiProvider {
  readonly name: string;
  generate(input: AiPrompt): Promise<AiResult>;
  transcribe?(input: { mediaUrl: string; language?: string }): Promise<{ provider: string; text: string }>;
}
