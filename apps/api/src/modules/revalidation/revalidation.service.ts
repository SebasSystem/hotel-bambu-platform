import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REVALIDATE_SECRET_HEADER } from '@hotel-bambu/shared';
import type { Env } from '../../config/env.js';

const TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 1_000;
const ATTEMPTS = 2;

/**
 * On-demand revalidation of the Next.js cache (requirement 21): `POST ${WEB_INTERNAL_URL}/api/revalidate`
 * with `{ tags }` and the shared secret header. Fire-and-forget: one retry, errors are logged and
 * never fail the admin request. Disabled (debug log only) when WEB_INTERNAL_URL is not set.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  private readonly endpoint: string | null;
  private readonly secret: string;

  constructor(config: ConfigService<Env, true>) {
    const base = config.get('WEB_INTERNAL_URL', { infer: true });
    this.endpoint = base ? `${base.replace(/\/+$/, '')}/api/revalidate` : null;
    this.secret = config.get('REVALIDATE_SECRET', { infer: true }) ?? '';
  }

  /** Schedules revalidation and returns immediately. */
  revalidate(tags: readonly string[]): void {
    void this.send(tags);
  }

  /** Awaitable variant (tests, scripts). Resolves to true on success. Never rejects. */
  async send(tags: readonly string[]): Promise<boolean> {
    const unique = [...new Set(tags)];
    if (unique.length === 0) return true;
    if (!this.endpoint) {
      this.logger.debug(`Revalidation disabled (WEB_INTERNAL_URL unset): ${unique.join(', ')}`);
      return false;
    }

    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', [REVALIDATE_SECRET_HEADER]: this.secret },
          body: JSON.stringify({ tags: unique }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) return true;
        this.logger.warn(
          `Revalidation answered ${response.status} (attempt ${attempt}): ${unique.join(', ')}`,
        );
      } catch (error) {
        this.logger.warn(
          `Revalidation failed (attempt ${attempt}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    this.logger.error(`Revalidation gave up: ${unique.join(', ')}`);
    return false;
  }
}
