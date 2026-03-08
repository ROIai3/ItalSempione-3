import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection string'),

  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters'),

  N8N_WEBHOOK_BASE: z
    .string()
    .url()
    .default('http://localhost:5678/webhook'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => {
        const errors = (value as { _errors: string[] })._errors;
        return `  ${key}: ${errors.join(', ')}`;
      })
      .join('\n');

    console.error('Environment validation failed:\n' + messages);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
