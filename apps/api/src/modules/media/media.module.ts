import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { MediaController } from './media.controller.js';
import { MediaService, OBJECT_STORAGE, UnconfiguredStorage } from './media.service.js';
import { S3ObjectStorage, type ObjectStorage } from './object-storage.js';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): ObjectStorage => {
        const accessKey = config.get('S3_ACCESS_KEY', { infer: true });
        const secretKey = config.get('S3_SECRET_KEY', { infer: true });
        if (!accessKey || !secretKey) {
          new Logger('MediaModule').warn(
            'S3_ACCESS_KEY/S3_SECRET_KEY unset: media uploads disabled',
          );
          return new UnconfiguredStorage();
        }
        return new S3ObjectStorage({
          S3_ENDPOINT: config.get('S3_ENDPOINT', { infer: true }),
          S3_REGION: config.get('S3_REGION', { infer: true }),
          S3_BUCKET: config.get('S3_BUCKET', { infer: true }),
          S3_ACCESS_KEY: accessKey,
          S3_SECRET_KEY: secretKey,
          S3_FORCE_PATH_STYLE: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
        });
      },
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
