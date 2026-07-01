export type AiProviderName = 'openai' | 'gemini' | 'mock';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) {
    return fallback;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  api: {
    host: process.env.API_HOST ?? '0.0.0.0',
    port: toNumber(process.env.API_PORT, 3000),
    publicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:3000',
    corsOrigins: toList(process.env.CORS_ORIGINS, ['http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:19006', 'http://localhost:5173']),
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    accessTtlSeconds: toNumber(process.env.JWT_ACCESS_TTL_SECONDS, 900),
    refreshTtlSeconds: toNumber(process.env.JWT_REFRESH_TTL_SECONDS, 60 * 60 * 24 * 30),
  },
  ai: {
    provider: (process.env.AI_PROVIDER ?? 'mock') as AiProviderName,
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    openaiTextModel: process.env.OPENAI_TEXT_MODEL ?? 'gpt-4.1-mini',
    openaiTranscribeModel: process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiTextModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-1.5-flash',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'r2',
    bucket: process.env.S3_BUCKET ?? 'novasocial-media',
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'auto',
    cdnBaseUrl: process.env.CDN_BASE_URL ?? 'http://localhost:9000/novasocial-media',
    maxVideoBytes: toNumber(process.env.MAX_VIDEO_BYTES, 524_288_000),
  },
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 240),
  },
};
