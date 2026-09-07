import { handleStandaloneDemo, standaloneDemoEnabled } from '@/lib/standalone-demo';

type Context = { params: Promise<{ path: string[] }> };

async function respond(request: Request, context: Context) {
  if (!standaloneDemoEnabled()) {
    return Response.json(
      { error: { code: 'API_PROXY_REQUIRED', message: 'โปรดตั้งค่า API_INTERNAL_URL' } },
      { status: 503 },
    );
  }
  const { path } = await context.params;
  const search = new URL(request.url).search;
  const result = handleStandaloneDemo(`/${path.join('/')}${search}`, request.method);
  return Response.json(result.body, { status: result.status });
}

export const GET = respond;
export const POST = respond;
