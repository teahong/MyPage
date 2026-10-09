import { supabase } from './supabase.js';

const BUCKET = 'thumbnails';

// 경로는 {작업물 id}-{timestamp}.{ext}. 같은 작업물의 썸네일을 바꿔도 경로가 겹치지 않는다.
export async function uploadThumbnail(workId, { blob, type, ext }) {
  const path = `${workId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteThumbnail(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
