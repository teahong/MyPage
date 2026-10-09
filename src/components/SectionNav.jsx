import { useEffect, useRef } from 'react';

// 첫 페이지 섹션 목차. 누르면 그 섹션으로 이동하고, 스크롤하면 지금 보는 섹션이 강조된다.
// 넓은 화면에서는 왼쪽 세로 목차, 좁은 화면에서는 위에 붙는 가로 버튼 줄이다 (CSS로 전환).
export default function SectionNav({ sections, activeId, onNavigate }) {
  const listRef = useRef(null);
  const firstCategory = sections.findIndex((section) => section.tone !== undefined);

  // 가로 줄일 때 강조된 버튼이 가려지지 않게 줄만 옆으로 민다 (페이지 스크롤은 건드리지 않는다).
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const link = list.querySelector(`[data-section="${activeId}"]`);
    if (!link) return;
    const item = link.parentElement;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2 });
  }, [activeId]);

  return (
    <nav className="section-nav" aria-label="이 페이지 목차">
      <ul ref={listRef} className="section-nav__list">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className={index === firstCategory ? 'section-nav__item section-nav__item--group' : 'section-nav__item'}
          >
            {index === firstCategory && (
              <span className="section-nav__group-label" aria-hidden="true">
                작업물
              </span>
            )}
            <a
              href={`#${section.id}`}
              data-section={section.id}
              className={`section-nav__link tone-${section.tone ?? 'all'}`}
              aria-current={section.id === activeId ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(section.id);
              }}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
