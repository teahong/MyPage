import { useState } from 'react';
import WorkGrid from './WorkGrid.jsx';
import WorkOrderEditor from './WorkOrderEditor.jsx';

const STEP = 6;

// 첫 페이지의 카테고리 한 칸. 처음에는 6건을 보여주고 "더 보기"로 6건씩 늘린다.
// canReorder면(관리자, 검색 중 아님) "순서 바꾸기"로 이 카테고리의 순서를 정할 수 있다.
export default function CategorySection({ id, name, tone, works, categories, canReorder, onReordered }) {
  const [count, setCount] = useState(STEP);
  const [editing, setEditing] = useState(false);
  const remaining = works.length - count;
  const showEditor = editing && canReorder;

  async function handleSaved() {
    await onReordered();
    setEditing(false);
  }

  return (
    <section id={id} className="home-section" aria-labelledby={`${id}-title`} tabIndex={-1}>
      <div className="category-section__head">
        <h3 id={`${id}-title`} className={`category-section__title tone-${tone}`}>
          {name}
          <span className="category-section__count">{works.length}</span>
        </h3>
        {canReorder && !showEditor && works.length > 1 && (
          <button type="button" className="text-button" onClick={() => setEditing(true)}>
            순서 바꾸기
          </button>
        )}
      </div>
      {showEditor && <WorkOrderEditor works={works} onCancel={() => setEditing(false)} onSaved={handleSaved} />}
      {!showEditor && works.length === 0 && <p className="category-section__empty">아직 작업물이 없어요</p>}
      {!showEditor && works.length > 0 && <WorkGrid works={works.slice(0, count)} categories={categories} />}
      {!showEditor && remaining > 0 && (
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
