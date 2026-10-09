// 작업물 입력 검증. 같은 규칙이 supabase/schema.sql의 check 제약에도 있다.
// 각 함수는 문제가 있으면 화면에 보여줄 문구를, 없으면 ''를 돌려준다.

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 2000;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateTitle(title) {
  const value = title.trim();
  if (!value) return '제목을 입력해 주세요';
  if (value.length > TITLE_MAX) return `제목은 ${TITLE_MAX}자 이내로 써 주세요`;
  return '';
}

export function validateDescription(description) {
  const value = description.trim();
  if (!value) return '설명을 입력해 주세요';
  if (value.length > DESCRIPTION_MAX) return `설명은 ${DESCRIPTION_MAX}자 이내로 써 주세요`;
  return '';
}

export function validateCategory(category) {
  return category ? '' : '카테고리를 골라 주세요';
}

// http:, https:만 허용한다 (javascript: 등 차단). 공백이 들어간 주소도 막는다.
export function validateLinkUrl(linkUrl) {
  const value = linkUrl.trim();
  if (!value) return '링크 주소를 입력해 주세요';
  const message = 'https://로 시작하는 주소를 넣어 주세요';
  if (!/^https?:\/\/\S+$/i.test(value)) return message;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return message;
    if (!url.hostname) return message;
  } catch {
    return message;
  }
  return '';
}

// file이 없을 때: 추가 화면에서는 필수, 수정 화면에서는 기존 썸네일 유지.
export function validateThumbnail(file, { required }) {
  if (!file) return required ? '썸네일 이미지를 골라 주세요' : '';
  if (!THUMBNAIL_TYPES.includes(file.type)) return 'jpg, png, webp 이미지만 올릴 수 있어요';
  if (file.size > THUMBNAIL_MAX_BYTES) return '5MB 이하 이미지만 올릴 수 있어요';
  return '';
}

// 'YYYY-MM-DD' 형식이고 실제로 있는 날짜인지.
export function validateDate(date) {
  if (!date) return '날짜를 골라 주세요';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return '날짜를 다시 골라 주세요';
  const [, y, m, d] = match.map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) {
    return '날짜를 다시 골라 주세요';
  }
  return '';
}

// 문제가 있는 항목만 담은 객체를 돌려준다. 비어 있으면 저장해도 된다.
export function validateWork(values, file, { requireThumbnail }) {
  const errors = {
    title: validateTitle(values.title),
    description: validateDescription(values.description),
    category: validateCategory(values.category),
    linkUrl: validateLinkUrl(values.linkUrl),
    thumbnail: validateThumbnail(file, { required: requireThumbnail }),
    date: validateDate(values.date),
  };
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
