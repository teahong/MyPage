// 링크 주소의 대표 이미지(og:image 등)를 찾아 이미지 바이트를 돌려준다.
// 브라우저는 CORS 때문에 다른 사이트 HTML을 읽을 수 없어서 이 함수가 대신 받아 온다.
//
// - 관리자만 호출할 수 있다. 호출자의 토큰으로 DB의 public.is_admin()을 불러 확인한다.
// - 배포: npx supabase functions deploy fetch-og-image --no-verify-jwt --project-ref <ref>
//   (인증은 함수 안에서 is_admin()으로 직접 한다)
// - 응답: 200 application/octet-stream (이미지) / 4xx JSON { error }
import { createClient } from 'npm:@supabase/supabase-js@2';

const PAGE_TIMEOUT_MS = 8000;
const IMAGE_TIMEOUT_MS = 10000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // YouTube처럼 대표 이미지 태그가 1MB 가까이 뒤에 있는 페이지도 있다
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const USER_AGENT = 'Mozilla/5.0 (compatible; WorkArchiveBot/1.0; link preview)';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// http(s)만, 내부망 주소는 막는다. (관리자만 쓰는 함수라 DNS 재바인딩까지는 막지 않는다)
function toSafeUrl(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^(fc|fd|fe80)/.test(host)
  ) {
    return null;
  }
  return url;
}

// limit을 넘으면 truncate가 true일 때 앞부분만, 아니면 null을 돌려준다.
async function readLimited(response: Response, limit: number, truncate = false): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (total + value.length > limit) {
      await reader.cancel();
      if (!truncate) return null;
      chunks.push(value.subarray(0, limit - total));
      total = limit;
      break;
    }
    total += value.length;
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function attr(tag: string, name: string) {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? decodeEntities(match[2] ?? match[3] ?? match[4] ?? '').trim() : '';
}

// og:image → twitter:image → <link rel="image_src"> 순서로 찾는다.
function findImageUrl(html: string, baseUrl: string): string | null {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const wanted = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];
  for (const key of wanted) {
    for (const tag of metas) {
      const name = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase();
      const content = attr(tag, 'content');
      if (name === key && content) {
        try {
          return new URL(content, baseUrl).toString();
        } catch {
          // 다음 후보로
        }
      }
    }
  }
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of links) {
    if (attr(tag, 'rel').toLowerCase() === 'image_src' && attr(tag, 'href')) {
      try {
        return new URL(attr(tag, 'href'), baseUrl).toString();
      } catch {
        // 무시
      }
    }
  }
  return null;
}

// YouTube는 서버 IP에서 페이지를 요청하면 로봇 확인 페이지(429)를 준다.
// 그래서 주소에서 영상 ID를 뽑아 썸네일 이미지 서버(i.ytimg.com)에서 바로 받는다.
function youtubeThumbnailUrls(url: URL): URL[] {
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(url.pathname)?.[1] ?? null;
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return [];
  // 고화질이 없는 영상도 있어서 기본 화질을 다음 후보로 둔다.
  return ['maxresdefault', 'hqdefault'].map((name) => new URL(`https://i.ytimg.com/vi/${id}/${name}.jpg`));
}

function isRasterImage(contentType: string) {
  return contentType.startsWith('image/') && !contentType.includes('svg');
}

async function fetchImage(url: URL): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
    redirect: 'follow',
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
  });
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!response.ok || !isRasterImage(contentType)) return json(404, { error: 'image_not_found' });
  const bytes = await readLimited(response, MAX_IMAGE_BYTES);
  if (!bytes) return json(413, { error: 'image_too_large' });
  return new Response(bytes, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/octet-stream' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // 관리자 확인
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || isAdmin !== true) return json(403, { error: 'forbidden' });

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'bad_request' });
  }
  const pageUrl = toSafeUrl(body.url);
  if (!pageUrl) return json(400, { error: 'invalid_url' });

  try {
    for (const candidate of youtubeThumbnailUrls(pageUrl)) {
      const image = await fetchImage(candidate);
      if (image.ok) return image;
    }

    const page = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,image/*;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    const contentType = page.headers.get('content-type')?.toLowerCase() ?? '';

    // 링크 자체가 이미지인 경우
    if (page.ok && isRasterImage(contentType)) {
      await page.body?.cancel();
      return await fetchImage(new URL(page.url));
    }
    if (!page.ok || !contentType.includes('html')) {
      await page.body?.cancel();
      return json(404, { error: 'image_not_found' });
    }

    const htmlBytes = await readLimited(page, MAX_HTML_BYTES, true);
    const html = htmlBytes ? new TextDecoder().decode(htmlBytes) : '';
    const imageUrl = findImageUrl(html, page.url);
    const safeImageUrl = imageUrl ? toSafeUrl(imageUrl) : null;
    if (!safeImageUrl) return json(404, { error: 'image_not_found' });

    return await fetchImage(safeImageUrl);
  } catch (error) {
    console.error(error);
    return json(502, { error: 'fetch_failed' });
  }
});
