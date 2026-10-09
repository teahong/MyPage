// 카테고리마다 다른 색. 색 값은 tokens.css의 --category-1..7-*에 있고,
// 여기서는 몇 번 색을 쓸지만 정한다. 카테고리 목록 순서대로 배정해 7개까지는 겹치지 않는다.
const TONE_COUNT = 7;

function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.codePointAt(0)) >>> 0;
  return value;
}

// 목록을 불러오기 전에는 0(중립색)을 돌려줘 색이 잠깐 바뀌어 보이지 않게 한다.
// 목록에 없는 이름은 이름으로 정한다.
export default function categoryTone(name, categories) {
  if (!categories) return 0;
  const index = categories.indexOf(name);
  return ((index >= 0 ? index : hash(name)) % TONE_COUNT) + 1;
}
