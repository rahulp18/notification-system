import dotEnv from 'dotenv';
import * as z from 'zod';
dotEnv.config();
const envSchema = z.object({
  DATABASE_URL: z.string().nonempty(),
});
export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});
