// 제목, 설명에서 부분 일치로 찾는다. 대소문자와 앞뒤 공백은 무시한다.
// 전체 작업물을 메모리에 두고 거르는 방식이라 500건을 넘으면 서버 검색으로 바꾸는 걸 검토한다 (문서 3.4).
export function normalizeQuery(query) {
  return query.trim().toLowerCase();
}

export default function searchWorks(works, query) {
  const needle = normalizeQuery(query);
  if (!needle) return works;
  return works.filter(
    (work) => work.title.toLowerCase().includes(needle) || work.description.toLowerCase().includes(needle),
  );
}
