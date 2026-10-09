import { supabase } from './supabase.js';

// 한 번 불러온 목록을 재사용한다. 카테고리를 만들거나 지우거나 순서를 바꾸면 비운다.
let cached = null;

// 관리자가 정한 순서(sort_order), 순서가 없는 것(새로 만든 것)은 뒤에 기본 카테고리, 추가한 순서로.
// 이 순서로 카테고리 색도 정한다 (utils/categoryTone.js).
export function fetchCategories() {
  cached ??= supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true, nullsFirst: false })
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

// 작업물이 남아 있으면 외래키 때문에 지워지지 않는다. 그때는 code 'in_use'를 붙여 던진다.
// 권한이 없으면 RLS 때문에 오류 없이 0건이 지워지므로 지워진 행으로 확인한다.
export async function deleteCategory(name) {
  const { data, error } = await supabase.from('categories').delete().eq('name', name).select('name');
  cached = null;

  if (error?.code === '23503') throw Object.assign(new Error(error.message), { code: 'in_use' });
  if (error) throw error;
  if (data.length === 0) throw new Error('삭제된 카테고리가 없음');
}

// 카테고리 이름을 보여줄 순서대로 받아 1, 2, 3...으로 저장한다.
export async function saveCategoryOrder(names) {
  const { data, error } = await supabase.rpc('set_category_order', { ordered_names: names });
  cached = null;

  if (error) throw error;
  if (data !== names.length) throw new Error('순서가 저장된 카테고리 수가 다름');
}
