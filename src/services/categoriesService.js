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

// 같은 이름이 이미 있으면 그대로 둔다 (작업물 저장이 실패해 다시 시도하는 경우).
// 대소문자만 다른 이름은 DB 유니크 인덱스가 막는다. 그때는 code 'duplicate'를 붙여 던진다.
export async function createCategory(name) {
  const { error } = await supabase
    .from('categories')
    .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });

  if (!error) return;
  if (error.code === '23505') throw Object.assign(new Error(error.message), { code: 'duplicate' });
  throw error;
}
