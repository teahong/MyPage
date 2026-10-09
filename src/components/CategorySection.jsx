import { useState } from 'react';
import WorkGrid from './WorkGrid.jsx';

const STEP = 6;

// 첫 페이지의 카테고리 한 칸. 처음에는 6건을 보여주고 "더 보기"로 6건씩 늘린다.
export default function CategorySection({ id, name, tone, works, categories }) {
  const [count, setCount] = useState(STEP);
  const remaining = works.length - count;

  return (
    <section id={id} className="home-section" aria-labelledby={`${id}-title`} tabIndex={-1}>
      <h3 id={`${id}-title`} className={`category-section__title tone-${tone}`}>
        {name}
        <span className="category-section__count">{works.length}</span>
      </h3>
      {works.length === 0 ? (
        <p className="category-section__empty">아직 작업물이 없어요</p>
      ) : (
        <WorkGrid works={works.slice(0, count)} categories={categories} />
      )}
      {remaining > 0 && (
        <button
          type="button"
          className="button category-section__more"
          onClick={() => setCount((prev) => prev + STEP)}
        >
          {`더 보기 (${remaining}개 남음)`}
        </button>
      )}
    </section>
  );
}
