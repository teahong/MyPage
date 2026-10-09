import { useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 12;
// 목록 끝에 닿기 조금 전에 미리 다음 묶음을 보여준다.
const PRELOAD_MARGIN = '400px 0px';

// 전체 total건 중 몇 건을 보여줄지 정한다. sentinelRef를 목록 끝 요소에 달면,
// 그 요소가 화면에 가까워질 때마다 12건씩 늘린다. resetKey가 바뀌면(필터, 검색어) 12건으로 돌아간다.
export default function useInfiniteScroll(total, resetKey) {
  const [count, setCount] = useState(PAGE_SIZE);
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  const sentinelRef = useRef(null);

  if (lastResetKey !== resetKey) {
    setLastResetKey(resetKey);
    setCount(PAGE_SIZE);
  }

  const hasMore = count < total;

  // count가 바뀔 때마다 다시 관찰한다. 늘린 뒤에도 끝 요소가 여전히 보이면(큰 화면) 바로 한 번 더 늘어난다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCount((prev) => prev + PAGE_SIZE);
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [count, hasMore]);

  return { visibleCount: Math.min(count, total), hasMore, sentinelRef };
}
