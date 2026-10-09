import { useEffect, useState } from 'react';

// 섹션 윗변이 화면 위에서 이 비율 지점을 지나면 그 섹션을 지금 보는 섹션으로 본다.
const ACTIVE_LINE = 0.25;

// ids 순서대로 놓인 섹션 중 지금 보고 있는 섹션의 id를 돌려준다.
export default function useScrollSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0] ?? null);
  const idsKey = ids.join('\n');

  useEffect(() => {
    const list = idsKey ? idsKey.split('\n') : [];
    if (list.length === 0) return undefined;
    let frame = 0;

    function update() {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE;
      let current = list[0];
      // 맨 위에서는 첫 섹션이 짧아 다음 섹션이 기준선을 넘어 있어도 첫 섹션으로 본다.
      if (window.scrollY > 0) {
        for (const id of list) {
          const element = document.getElementById(id);
          if (element && element.getBoundingClientRect().top <= line) current = id;
        }
      }
      setActiveId(current);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  return activeId;
}
