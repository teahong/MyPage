// 카테고리 단일 선택. selected가 ''이면 "전체".
export default function CategoryFilter({ categories, selected, onSelect }) {
  const options = [{ value: '', label: '전체' }, ...categories.map((name) => ({ value: name, label: name }))];

  return (
    <nav className="category-filter" aria-label="카테고리">
      <ul className="category-filter__list">
        {options.map(({ value, label }) => (
          <li key={value || 'all'}>
            <button
              type="button"
              className="category-filter__button"
              aria-pressed={selected === value}
              onClick={() => onSelect(value)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
