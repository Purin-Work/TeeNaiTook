import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env')) {
  console.log('.env already exists; preserved.');
} else {
  let contents = readFileSync('.env.example', 'utf8');
  for (const name of ['JWT_SECRET', 'CRON_SECRET', 'ADMIN_SEED_PASSWORD']) {
    contents = contents.replace(`${name}=\n`, `${name}=${randomBytes(32).toString('hex')}\n`);
  }
  contents = contents.replaceAll('change-local-password', randomBytes(24).toString('hex'));
  writeFileSync('.env', contents, { mode: 0o600 });
  console.log('Created .env with random local credentials. Admin credentials are in .env.');
}
