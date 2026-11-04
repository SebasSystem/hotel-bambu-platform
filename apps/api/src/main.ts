import 'reflect-metadata';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp, createFastifyAdapter } from './app.setup.js';
import { envSchema, type Env } from './config/env.js';

async function bootstrap(): Promise<void> {
  // The adapter needs env before Nest boots: load the same .env files ConfigModule reads (real
  // environment variables always win; loadEnvFile never overrides them).
  for (const file of ['.env', path.resolve(import.meta.dirname, '../../../.env')]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Missing file: rely on the process environment.
    }
  }
  const env = envSchema.parse(process.env);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    createFastifyAdapter(env),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  await configureApp(app, env);

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  await app.listen(
    config.get('API_PORT', { infer: true }),
    config.get('API_HOST', { infer: true }),
  );
}

void bootstrap();
