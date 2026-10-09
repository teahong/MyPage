import { supabase } from './supabase.js';

// 이미지 파일의 앞부분 바이트로 형식을 알아낸다. 함수는 형식과 상관없이 octet-stream으로 돌려준다.
function sniffImageType(bytes) {
  const startsWith = (...values) => values.every((value, index) => bytes[index] === value);
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (startsWith(0x47, 0x49, 0x46)) return 'image/gif';
  if (startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp';
  return 'application/octet-stream';
}

// 링크 사이트의 대표 이미지를 Edge Function(fetch-og-image)으로 받아 File로 돌려준다.
// 찾지 못하거나 실패하면 null. 관리자만 호출할 수 있다.
export async function fetchLinkImage(linkUrl) {
  const { data, error } = await supabase.functions.invoke('fetch-og-image', {
    body: { url: linkUrl.trim() },
  });
  if (error || !(data instanceof Blob) || data.size === 0) {
    if (error) console.error(error);
    return null;
  }
  const head = new Uint8Array(await data.slice(0, 12).arrayBuffer());
  return new File([data], 'link-image', { type: sniffImageType(head) });
}
