import { createInterface } from 'node:readline/promises';
import { SYSTEM_ROLE_NAME } from '@hotel-bambu/shared';
import { createAdminUser } from '../modules/admin-users/create-admin.js';
import { PASSWORD_MIN_LENGTH } from '../modules/auth/password.js';
import { createScriptPrisma, log, runScript } from './lib/script-runtime.js';

/**
 * Creates an administrator (requirement 15.5 / 16.1). Two modes, never default credentials:
 *   - one-shot: ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] pnpm admin:create
 *   - interactive (TTY): pnpm admin:create   (password typed without echo, asked twice)
 * `--role <name>` (or `--role=<name>`) picks the role of a new admin; default Administrador.
 * `--reset-password` sets a new password for an existing admin, unlocks it and ends its sessions.
 */

/** Value of `--role <name>` / `--role=<name>`, if given. */
function roleArgument(argv: readonly string[]): string | undefined {
  const index = argv.findIndex((arg) => arg === '--role' || arg.startsWith('--role='));
  if (index === -1) return undefined;
  const arg = argv[index]!;
  const value = arg.startsWith('--role=') ? arg.slice('--role='.length) : argv[index + 1];
  if (!value?.trim() || value.startsWith('--')) throw new Error('--role needs a role name.');
  return value.trim();
}

/** Reads a line from a TTY without echoing it. */
function promptHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Cancelled.'));
          return;
        }
        if (char === '\u007f' || char === '\b') value = [...value].slice(0, -1).join('');
        else value += char;
      }
    };
    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on('data', onData);
  });
}

async function readCredentials(): Promise<{ email: string; password: string; name?: string }> {
  const envEmail = process.env['ADMIN_EMAIL'];
  const envPassword = process.env['ADMIN_PASSWORD'];
  if (envEmail && envPassword) {
    return { email: envEmail, password: envPassword, name: process.env['ADMIN_NAME'] };
  }
  if (!process.stdin.isTTY) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD, or run in an interactive terminal.');
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = envEmail ?? (await rl.question('Admin email: '));
  const name = (await rl.question('Name (optional): ')) || undefined;
  rl.close();

  const password = await promptHidden(`Password (min ${PASSWORD_MIN_LENGTH} characters): `);
  const confirmation = await promptHidden('Repeat password: ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  return { email, password, name };
}

await runScript('admin:create', async () => {
  const resetPassword = process.argv.includes('--reset-password');
  const role = roleArgument(process.argv) ?? SYSTEM_ROLE_NAME;
  const credentials = await readCredentials();
  const prisma = createScriptPrisma();
  try {
    const result = await createAdminUser(prisma, { ...credentials, role, resetPassword });
    log(
      result.action === 'created'
        ? `admin:create: created admin ${result.email} (${result.id}) with role ${role}`
        : `admin:create: password reset for ${result.email}; sessions revoked`,
    );
    if (process.env['ADMIN_PASSWORD']) {
      log('Remove ADMIN_PASSWORD from your environment/shell history now.');
    }
  } finally {
    await prisma.$disconnect();
  }
});
