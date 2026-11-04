import { inject } from 'vitest';

// Runs in every test worker before the test files are imported.
const testDatabaseUrl = inject('testDatabaseUrl');
if (testDatabaseUrl) process.env['DATABASE_URL'] = testDatabaseUrl;
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'fatal';
// Integration suites log in repeatedly from 127.0.0.1.
process.env['RATE_LIMIT_LOGIN_PER_MINUTE'] = '100';
// Never talk to real external services from tests.
delete process.env['WEB_INTERNAL_URL'];
delete process.env['S3_ACCESS_KEY'];
delete process.env['S3_SECRET_KEY'];
