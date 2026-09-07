import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvironment } from '../../src/common/config';
const env = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  JWT_SECRET: 'test-only-configuration-key-32-chars',
  CRON_SECRET: 'test-only-scheduler-key-32-characters',
  FRONTEND_URL: 'https://teenaitook.example',
};
test('production config rejects demo mode, insecure origins, missing secrets and invalid booleans', () => {
  assert.equal(parseEnvironment({ ...env, NODE_ENV: 'production' }).DEMO_MODE, false);
  assert.equal(
    parseEnvironment({ ...env, NODE_ENV: 'production', SAMPLE_DATA_ENABLED: 'true' })
      .SAMPLE_DATA_ENABLED,
    true,
  );
  assert.throws(() => parseEnvironment({ ...env, NODE_ENV: 'production', DEMO_MODE: 'true' }));
  assert.throws(() =>
    parseEnvironment({ ...env, NODE_ENV: 'production', FRONTEND_URL: 'http://localhost:3000' }),
  );
  assert.throws(() => parseEnvironment({ ...env, JWT_SECRET: '' }));
  assert.throws(() => parseEnvironment({ ...env, SCRAPER_ENABLED: 'yes' }));
});
