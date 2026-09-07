import { setTimeout as delay } from 'node:timers/promises';
for (const url of process.argv.slice(2)) {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      ready = (await fetch(url, { signal: AbortSignal.timeout(1000) })).ok;
    } catch {
      /* Server may still be starting. */
    }
    if (ready) break;
    await delay(1000);
  }
  if (!ready) throw new Error(`Server did not become ready: ${url}`);
}
