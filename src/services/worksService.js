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
    sortOrder: row.sort_order, // 관리자가 정한 순서. null이면 아직 정하지 않음
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// 관리자가 정한 순서(sort_order)대로. 순서가 없는 작업물(새로 추가했거나 카테고리를 옮긴 것)이 먼저 오고,
// 그 안에서는 날짜 최신순, 같으면 등록 시각 최신순.
export async function fetchAllWorks() {
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: true })
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

// thumbnail이 null이면 썸네일 칸은 그대로 둔다. resetOrder면 정해 둔 순서를 지운다(카테고리를 옮겼을 때).
export async function updateWork(id, values, thumbnail, { resetOrder = false } = {}) {
  const changes = {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    link_url: values.linkUrl.trim(),
    date: values.date,
  };
  if (resetOrder) changes.sort_order = null;
  if (thumbnail) {
    changes.thumbnail_url = thumbnail.url;
    changes.thumbnail_path = thumbnail.path;
  }
  const { data, error } = await supabase.from('works').update(changes).eq('id', id).select().single();

  if (error) throw error;
  return toWork(data);
}

// 한 카테고리의 작업물 id를 보여줄 순서대로 받아 1, 2, 3...으로 저장한다.
// 권한이 없으면 RLS 때문에 0건이 바뀌므로 바뀐 개수로 확인한다.
export async function saveWorkOrder(ids) {
  const { data, error } = await supabase.rpc('set_work_order', { ordered_ids: ids });
  if (error) throw error;
  if (data !== ids.length) throw new Error('순서가 저장된 작업물 수가 다름');
}

export async function deleteWork(id) {
  // 권한이 없으면 RLS 때문에 오류 없이 0건이 지워진다. 그래서 지워진 행을 돌려받아 확인한다.
  const { data, error } = await supabase.from('works').delete().eq('id', id).select('id');
  if (error) throw error;
  if (data.length === 0) throw new Error('삭제된 작업물이 없음');
}
