import dotEnv from 'dotenv';
import { defineConfig } from 'prisma/config';
import { envSchema } from './src/config/env';

dotEnv.config();
const env = envSchema.parse(process.env);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || env.DATABASE_URL,
  },
});
