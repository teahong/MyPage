import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import CategoryFilter from '../components/CategoryFilter.jsx';
import CharacterMessage from '../components/CharacterMessage.jsx';
import SearchBar from '../components/SearchBar.jsx';
import WorkGrid from '../components/WorkGrid.jsx';
import useAuth from '../hooks/useAuth.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useWorks from '../hooks/useWorks.js';
import { fetchCategories } from '../services/categoriesService.js';
import searchWorks from '../utils/searchWorks.js';

const QUERY_PREVIEW_MAX = 15;

// 결과 없음 문구가 길어지지 않게 검색어를 줄인다.
function previewQuery(query) {
  const value = query.trim();
  return value.length > QUERY_PREVIEW_MAX ? `${value.slice(0, QUERY_PREVIEW_MAX)}…` : value;
}

export default function HomePage() {
  const { works, status, reload } = useWorks();
  const { isAdmin } = useAuth();
  useDocumentTitle('');
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
  const query = searchParams.get('q') ?? '';
  // 검색어와 카테고리는 함께 적용한다 (AND).
  const inCategory = selected ? works.filter((work) => work.category === selected) : works;
  const visibleWorks = searchWorks(inCategory, query);
  // 필터나 검색어가 바뀌면 다시 12건부터 보여준다.
  const { visibleCount, hasMore, sentinelRef } = useInfiniteScroll(
    visibleWorks.length,
    JSON.stringify([selected, query]),
  );

  // 검색어, 필터는 주소에 담아 새로고침하거나 상세에서 돌아와도 유지한다.
  function setParam(name, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  }

  const handleSelect = (category) => setParam('category', category);
  const handleSearch = (value) => setParam('q', value.trim());

  return (
    <main className="container page">
      <SearchBar initialQuery={query} onSearch={handleSearch} />
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
        <CharacterMessage
          message={
            query.trim()
              ? `'${previewQuery(query)}'와 일치하는 작업물이 없어요`
              : '이 카테고리에는 아직 작업물이 없어요'
          }
        />
      )}
      {status === 'ready' && visibleWorks.length > 0 && (
        <>
          <WorkGrid works={visibleWorks.slice(0, visibleCount)} />
          {hasMore ? (
            <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
          ) : (
            <p className="list-end">마지막 작업물이에요</p>
          )}
        </>
      )}
    </main>
  );
}
