import { handleStandaloneDemo, standaloneDemoEnabled } from '@/lib/standalone-demo';

type Context = { params: Promise<{ path: string[] }> };

const hopByHopHeaders = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

async function proxyToBackend(request: Request, context: Context) {
  const apiBase = process.env.API_INTERNAL_URL?.replace(/\/$/, '');
  if (!apiBase) {
    return Response.json(
      { error: { code: 'API_PROXY_REQUIRED', message: 'โปรดตั้งค่า API_INTERNAL_URL' } },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const target = new URL(`${apiBase}/${path.map(encodeURIComponent).join('/')}`);
  target.search = new URL(request.url).search;
  const headers = new Headers(request.headers);
  hopByHopHeaders.forEach((header) => headers.delete(header));
  headers.set('accept-encoding', 'identity');

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(60000),
    });
    const responseHeaders = new Headers(upstream.headers);
    for (const header of ['connection', 'content-encoding', 'content-length', 'transfer-encoding'])
      responseHeaders.delete(header);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'Backend กำลังเริ่มทำงาน กรุณารอสักครู่แล้วลองใหม่',
        },
      },
      { status: 503 },
    );
  }
}

async function respond(request: Request, context: Context) {
  if (!standaloneDemoEnabled()) return proxyToBackend(request, context);
  const { path } = await context.params;
  const search = new URL(request.url).search;
  const result = handleStandaloneDemo(`/${path.join('/')}${search}`, request.method);
  return Response.json(result.body, { status: result.status });
}

export const GET = respond;
export const POST = respond;
export const PUT = respond;
export const PATCH = respond;
export const DELETE = respond;
export const OPTIONS = respond;
