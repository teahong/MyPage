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
