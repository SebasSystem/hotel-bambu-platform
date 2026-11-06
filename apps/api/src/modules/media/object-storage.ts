import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { z } from 'zod';

/** S3-compatible storage settings (RustFS in dev, any S3 provider in production; ADR 0005). */
export const s3EnvSchema = z.object({
  S3_ENDPOINT: z.url().default('http://localhost:9000'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(3).default('hotel-media'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

export type S3Env = z.infer<typeof s3EnvSchema>;

/** Minimal storage port so the media service can be tested without S3. */
export interface ObjectStorage {
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  deleteObjects(keys: readonly string[]): Promise<void>;
  listKeys(prefix: string, max?: number): Promise<string[]>;
}

/** Variants are immutable (new upload = new random key), so they can be cached forever. */
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly env: S3Env) {
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
  }

  async putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
      }),
    );
  }

  /** Whole object as bytes (media:variants reads a stored variant to derive new widths). */
  async getObject(key: string): Promise<Buffer> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.env.S3_BUCKET, Key: key }),
    );
    if (!result.Body) throw new Error(`Object ${key} has no body`);
    return Buffer.from(await result.Body.transformToByteArray());
  }

  async deleteObjects(keys: readonly string[]): Promise<void> {
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.env.S3_BUCKET,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
    }
  }

  async listKeys(prefix: string, max = 1000): Promise<string[]> {
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.env.S3_BUCKET, Prefix: prefix, MaxKeys: max }),
    );
    return (result.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : []));
  }

  destroy(): void {
    this.client.destroy();
  }
}
