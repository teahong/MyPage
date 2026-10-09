import { supabase } from './supabase.js';

// 기본 카테고리 먼저, 그다음 추가한 순서.
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map((row) => row.name);
}
