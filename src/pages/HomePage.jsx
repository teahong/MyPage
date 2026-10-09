import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import CategoryFilter from '../components/CategoryFilter.jsx';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkGrid from '../components/WorkGrid.jsx';
import useAuth from '../hooks/useAuth.js';
import useWorks from '../hooks/useWorks.js';
import { fetchCategories } from '../services/categoriesService.js';

export default function HomePage() {
  const { works, status, reload } = useWorks();
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState(null); // null: 불러오는 중
  const [searchParams, setSearchParams] = useSearchParams();

  // 카테고리를 못 불러와도 목록은 보여준다. 그때는 필터 줄을 숨긴다.
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => {
        console.error(error);
        setCategories([]);
      });
  }, []);

  // 주소의 카테고리가 목록에 없으면(지워졌거나 잘못 입력) 전체로 본다.
  // 카테고리를 불러오는 동안에는 주소 값을 그대로 써서 전체 목록이 잠깐 보이지 않게 한다.
  const requested = searchParams.get('category') ?? '';
  const selected = categories === null || categories.includes(requested) ? requested : '';
  const visibleWorks = selected ? works.filter((work) => work.category === selected) : works;

  function handleSelect(category) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (category) next.set('category', category);
        else next.delete('category');
        return next;
      },
      { replace: true },
    );
  }

  return (
    <main className="container page">
      {categories?.length > 0 && (
        <CategoryFilter categories={categories} selected={selected} onSelect={handleSelect} />
      )}
      {status === 'loading' && <CharacterMessage message="불러오는 중" role="status" />}
      {status === 'error' && (
        <CharacterMessage message="목록을 불러오지 못했어요" role="alert">
          <button type="button" className="button" onClick={reload}>
            다시 시도
          </button>
        </CharacterMessage>
      )}
      {status === 'ready' && works.length === 0 && (
        <CharacterMessage message="아직 등록된 작업물이 없어요">
          {isAdmin && (
            <Link to="/admin/new" className="button button--primary">
              추가
            </Link>
          )}
        </CharacterMessage>
      )}
      {status === 'ready' && works.length > 0 && visibleWorks.length === 0 && (
        <CharacterMessage message="이 카테고리에는 아직 작업물이 없어요" />
      )}
      {status === 'ready' && visibleWorks.length > 0 && <WorkGrid works={visibleWorks} />}
    </main>
  );
}
