import { supabase } from './supabase.js';

const FETCH_TIMEOUT_MS = 10000;

function toWork(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    linkUrl: row.link_url,
    thumbnailUrl: row.thumbnail_url,
    thumbnailPath: row.thumbnail_path,
    date: row.date, // 'YYYY-MM-DD'
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// 날짜 최신순, 같으면 등록 시각 최신순.
export async function fetchAllWorks() {
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS));

  if (error) throw error;
  return data.map(toWork);
}

// id는 썸네일 경로와 맞추려고 호출하는 쪽에서 crypto.randomUUID()로 먼저 만든다.
export async function createWork(id, values, thumbnail) {
  const { data, error } = await supabase
    .from('works')
    .insert({
      id,
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      link_url: values.linkUrl.trim(),
      thumbnail_url: thumbnail.url,
      thumbnail_path: thumbnail.path,
      date: values.date,
    })
    .select()
    .single();

  if (error) throw error;
  return toWork(data);
}

// 없으면 null. id 형식이 잘못된 경우(uuid 아님)도 없는 것으로 본다.
export async function fetchWork(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .maybeSingle()
    .abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS));

  if (error) throw error;
  return data ? toWork(data) : null;
}

// thumbnail이 null이면 썸네일 칸은 그대로 둔다.
export async function updateWork(id, values, thumbnail) {
  const changes = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    link_url: values.linkUrl.trim(),
    date: values.date,
  };
  if (thumbnail) {
    changes.thumbnail_url = thumbnail.url;
    changes.thumbnail_path = thumbnail.path;
  }
  const { data, error } = await supabase.from('works').update(changes).eq('id', id).select().single();

  if (error) throw error;
  return toWork(data);
}

export async function deleteWork(id) {
  // 권한이 없으면 RLS 때문에 오류 없이 0건이 지워진다. 그래서 지워진 행을 돌려받아 확인한다.
  const { data, error } = await supabase.from('works').delete().eq('id', id).select('id');
  if (error) throw error;
  if (data.length === 0) throw new Error('삭제된 작업물이 없음');
}
