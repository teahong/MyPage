import { supabase } from './supabase.js';

// 한 번 불러온 목록을 재사용한다. 카테고리를 새로 만들면 비운다.
let cached = null;

// 기본 카테고리 먼저, 그다음 추가한 순서. 이 순서로 카테고리 색도 정한다 (utils/categoryTone.js).
export function fetchCategories() {
  cached ??= supabase
    .from('categories')
    .select('name')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw error;
      return data.map((row) => row.name);
    })
    .catch((error) => {
      cached = null;
      throw error;
    });
  return cached;
}

// 같은 이름이 이미 있으면 그대로 둔다 (작업물 저장이 실패해 다시 시도하는 경우).
// 대소문자만 다른 이름은 DB 유니크 인덱스가 막는다. 그때는 code 'duplicate'를 붙여 던진다.
export async function createCategory(name) {
  const { error } = await supabase
    .from('categories')
    .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });
  cached = null;

  if (!error) return;
  if (error.code === '23505') throw Object.assign(new Error(error.message), { code: 'duplicate' });
  throw error;
}
