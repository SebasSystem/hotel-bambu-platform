import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { rateLimitOptions } from './common/rate-limit.config.js';
import { envSchema, type Env } from './config/env.js';
import { AmenitiesModule } from './modules/amenities/amenities.js';
import { AuditModule } from './modules/audit/admin-changes.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SessionAuthGuard } from './modules/auth/session-auth.guard.js';
import { ContentModule } from './modules/content/content.js';
import { DashboardModule } from './modules/dashboard/dashboard.js';
import { FaqsModule } from './modules/faq/faq.js';
import { GalleryModule } from './modules/gallery/gallery.js';
import { HealthModule } from './modules/health/health.module.js';
import { HotelModule } from './modules/hotel/hotel.js';
import { MediaModule } from './modules/media/media.module.js';
import { PoliciesModule } from './modules/policies/policies.js';
import { PromotionsModule } from './modules/promotions/promotions.js';
import { PublicModule } from './modules/public/public.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { ServicesModule } from './modules/services/services.js';
import { SocialLinksModule } from './modules/social-links/social-links.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Package-local .env first, then the monorepo root .env (see .env.example).
      envFilePath: ['.env', '../../.env'],
      validationSchema: envSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isDev = config.get('NODE_ENV', { infer: true }) === 'development';
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL', { infer: true }),
            redact: [
              'req.headers.cookie',
              'req.headers.authorization',
              'req.headers["x-csrf-token"]',
              'req.headers["x-revalidate-secret"]',
              'res.headers["set-cookie"]',
            ],
            transport: isDev ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        rateLimitOptions({
          TRUST_CLOUDFLARE: config.get('TRUST_CLOUDFLARE', { infer: true }),
          RATE_LIMIT_DEFAULT_PER_MINUTE: config.get('RATE_LIMIT_DEFAULT_PER_MINUTE', {
            infer: true,
          }),
          RATE_LIMIT_LOGIN_PER_MINUTE: config.get('RATE_LIMIT_LOGIN_PER_MINUTE', { infer: true }),
          RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE: config.get('RATE_LIMIT_PUBLIC_WRITE_PER_MINUTE', {
            infer: true,
          }),
          RATE_LIMIT_UPLOAD_PER_MINUTE: config.get('RATE_LIMIT_UPLOAD_PER_MINUTE', { infer: true }),
        }),
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    HotelModule,
    RoomsModule,
    AmenitiesModule,
    ServicesModule,
    PromotionsModule,
    MediaModule,
    GalleryModule,
    ContentModule,
    FaqsModule,
    PoliciesModule,
    SocialLinksModule,
    DashboardModule,
    PublicModule,
  ],
  providers: [
    // Global guards: rate limit, then session (deny by default) + CSRF in a single guard.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: SessionAuthGuard },
  ],
})
export class AppModule {}
