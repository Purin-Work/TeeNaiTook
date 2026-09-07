import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SafeHttpClient } from '../../src/scraper/http-client';
import { AppError } from '../../src/common/errors';
class RedirectClient extends SafeHttpClient {
  calls = 0;
  protected override async once() {
    this.calls++;
    return { body: '', status: 302, location: 'http://169.254.169.254/' };
  }
}
class BlockedClient extends SafeHttpClient {
  calls = 0;
  protected override async once() {
    this.calls++;
    return { body: '', status: 403 };
  }
}
class TimeoutClient extends SafeHttpClient {
  calls = 0;
  protected override async once(): Promise<{ body: string; status: number }> {
    this.calls++;
    throw new AppError('SCRAPER_TIMEOUT', 'timeout');
  }
}
test('redirects are revalidated before the next HTTP request', async () => {
  const client = new RedirectClient();
  await assert.rejects(client.fetchHtml('https://www.jib.co.th/product/1', 'jib'));
  assert.equal(client.calls, 1);
});
test('blocked responses are never retried', async () => {
  const client = new BlockedClient();
  await assert.rejects(client.fetchHtml('https://www.jib.co.th/product/1', 'jib'));
  assert.equal(client.calls, 1);
});
test('timeouts stop after two retries', async () => {
  const client = new TimeoutClient();
  await assert.rejects(client.fetchHtml('https://www.jib.co.th/product/1', 'jib'));
  assert.equal(client.calls, 3);
});
