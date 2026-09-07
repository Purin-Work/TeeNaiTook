import { z } from 'zod';

const boolean = z.enum(['true', 'false']).transform((value) => value === 'true');
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().int().min(60).max(86400).default(3600),
  CRON_SECRET: z.string().min(32),
  DEMO_MODE: boolean.default(false),
  SCRAPER_ENABLED: boolean.default(false),
  SCRAPER_USER_AGENT: z.string().min(10).default('TeeNaiTook/1.0 (+https://teenaitook.com/about)'),
  SCRAPER_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(12000),
  SCRAPER_DELAY_MS: z.coerce.number().int().min(500).max(10000).default(2000),
  SCRAPER_FRESHNESS_HOURS: z.coerce.number().min(1).max(168).default(12),
  SCRAPER_MAX_BODY_BYTES: z.coerce.number().int().min(1024).max(5000000).default(2000000),
  SWAGGER_ENABLED: boolean.default(true),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
});
export type Environment = z.infer<typeof envSchema>;
let configuration: Environment | undefined;
export function parseEnvironment(input: Record<string, unknown>): Environment {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  }
  const env = result.data;
  const origins = env.FRONTEND_URL.split(',').map((v) => new URL(v.trim()));
  if (origins.some((u) => u.origin !== u.href.replace(/\/$/, '') || u.username || u.password)) {
    throw new Error('FRONTEND_URL must contain comma-separated origins');
  }
  if (
    env.NODE_ENV === 'production' &&
    (env.DEMO_MODE || origins.some((u) => u.protocol !== 'https:'))
  ) {
    throw new Error('Production requires DEMO_MODE=false and HTTPS frontend origins');
  }
  return env;
}
export function getConfig(): Environment {
  configuration ??= parseEnvironment(process.env);
  return configuration;
}
