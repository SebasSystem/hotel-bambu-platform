/**
 * In-memory fixed-window counter used for the per IP+account login limit (requirement 16.1/16.3).
 * Single API instance (ADR 0001); a multi-instance deployment would move this to a shared store.
 */
export class FixedWindowLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 50_000,
  ) {}

  /** Records a hit; returns false when the key is over the limit for the current window. */
  hit(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size >= this.maxKeys) this.prune(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  reset(key: string): void {
    this.hits.delete(key);
  }

  private prune(now: number): void {
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
    // Still full (sustained attack): drop the oldest entries rather than grow without bound.
    if (this.hits.size >= this.maxKeys) {
      const excess = this.hits.size - this.maxKeys + 1;
      let removed = 0;
      for (const key of this.hits.keys()) {
        if (removed >= excess) break;
        this.hits.delete(key);
        removed += 1;
      }
    }
  }
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

/**
 * Next account state after a failed password. Reaching `maxAttempts` consecutive failures locks
 * the account for `lockMs` and resets the counter (requirement 16.1: progressive lockout per account).
 */
export function nextLockoutState(
  failedAttemptsAfterIncrement: number,
  maxAttempts: number,
  lockMs: number,
  now: Date,
): LockoutState {
  if (failedAttemptsAfterIncrement >= maxAttempts) {
    return { failedAttempts: 0, lockedUntil: new Date(now.getTime() + lockMs) };
  }
  return { failedAttempts: failedAttemptsAfterIncrement, lockedUntil: null };
}

export function isLocked(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}
