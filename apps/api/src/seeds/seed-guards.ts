type EnvLike = Readonly<Record<string, string | undefined>>;

const PRODUCTION_VALUES = new Set(['production', 'prod']);

/** True when NODE_ENV or APP_ENV designates production (requirement 15.5). */
export function isProductionEnv(env: EnvLike): boolean {
  return [env['NODE_ENV'], env['APP_ENV']].some(
    (value) => value !== undefined && PRODUCTION_VALUES.has(value.trim().toLowerCase()),
  );
}

/** Demo data must never reach production: throws when NODE_ENV/APP_ENV is production. */
export function assertDemoSeedAllowed(env: EnvLike): void {
  if (isProductionEnv(env)) {
    throw new Error(
      'Refusing to run db:seed:demo: NODE_ENV or APP_ENV is production. Demo data is local/staging only.',
    );
  }
}
