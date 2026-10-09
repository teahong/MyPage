import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import CategorySection from '../components/CategorySection.jsx';
import CharacterMessage from '../components/CharacterMessage.jsx';
import ExperienceList from '../components/ExperienceList.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SectionNav from '../components/SectionNav.jsx';
import profile from '../content/profile.js';
import useAuth from '../hooks/useAuth.js';
import useCategories from '../hooks/useCategories.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useScrollSpy from '../hooks/useScrollSpy.js';
import useWorks from '../hooks/useWorks.js';
import categoryTone from '../utils/categoryTone.js';
import scrollToSection from '../utils/scrollToSection.js';
import searchWorks from '../utils/searchWorks.js';

const QUERY_PREVIEW_MAX = 15;
const FIRST_SECTION = 'about';

// 결과 없음 문구가 길어지지 않게 검색어를 줄인다.
function previewQuery(query) {
  const value = query.trim();
  return value.length > QUERY_PREVIEW_MAX ? `${value.slice(0, QUERY_PREVIEW_MAX)}…` : value;
}

// 첫 페이지: 왼쪽에 고정된 소개와 목차, 오른쪽에 소개, 경력, 카테고리별 작업물 섹션.
// 목차를 누르거나 스크롤해서 섹션을 오간다. 지금 보는 섹션은 주소(?section=)에 담아
// 상세에서 돌아오면 그 섹션부터 보여준다.
export default function HomePage() {
  const { works, status, reload } = useWorks();
  const { isAdmin } = useAuth();
  useDocumentTitle('');
  const categories = useCategories(); // null: 불러오는 중, []: 실패
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const searching = query.trim() !== '';

  // 카테고리를 못 불러오면 작업물에 붙은 카테고리 이름으로 섹션을 만든다.
  const names = categories?.length ? categories : [...new Set(works.map((work) => work.category))];
  const tones = categories?.length ? categories : names;
  const matched = searchWorks(works, query);
  const groups =
    status === 'ready'
      ? names
          .map((name, index) => ({
            key: name,
            id: `category-${index + 1}`,
            label: name,
            tone: categoryTone(name, tones),
            works: matched.filter((work) => work.category === name),
          }))
          // 검색 중에는 일치하는 작업물이 있는 카테고리만 남긴다.
          .filter((group) => !searching || group.works.length > 0)
      : [];

  const sections = [
    { key: 'about', id: 'about', label: '소개' },
    ...(profile.experience.length > 0 ? [{ key: 'experience', id: 'experience', label: '경력' }] : []),
    ...groups,
  ];
  const activeId = useScrollSpy(sections.map((section) => section.id));
  const activeKey = sections.find((section) => section.id === activeId)?.key ?? FIRST_SECTION;

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

  // 목록과 카테고리를 다 불러온 뒤 한 번, 주소에 담긴 섹션으로 이동한다.
  const restoredRef = useRef(false);
  const requestedSection = searchParams.get('section') ?? '';
  const loaded = status !== 'loading' && categories !== null;
  const requestedId = sections.find((section) => section.key === requestedSection)?.id;
  useEffect(() => {
    if (!loaded || restoredRef.current) return;
    restoredRef.current = true;
    if (requestedId && requestedId !== FIRST_SECTION) scrollToSection(requestedId, { smooth: false });
  }, [loaded, requestedId]);

  // 지금 보는 섹션을 주소에 적는다. 첫 섹션이면 지운다.
  const sectionInUrl = requestedSection;
  useEffect(() => {
    if (!restoredRef.current) return;
    const value = activeKey === FIRST_SECTION ? '' : activeKey;
    if (value !== sectionInUrl) setParam('section', value);
  }, [activeKey, sectionInUrl]);

  const handleSearch = (value) => setParam('q', value.trim());

  return (
    <main className="container home">
      <aside className="home__side">
        <div className="home__intro">
          <h1 className="home__name">{profile.name}</h1>
          <p className="home__role">{profile.role}</p>
          <p className="home__tagline">{profile.tagline}</p>
        </div>
        <SectionNav sections={sections} activeId={activeId} onNavigate={scrollToSection} />
      </aside>

      <div className="home__content">
        <section id="about" className="home-section" aria-labelledby="about-title" tabIndex={-1}>
          <h2 id="about-title" className="home-section__title">
            소개
          </h2>
          <div className="about">
            {profile.philosophy.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        {profile.experience.length > 0 && (
          <section id="experience" className="home-section" aria-labelledby="experience-title" tabIndex={-1}>
            <h2 id="experience-title" className="home-section__title">
              경력
            </h2>
            <ExperienceList items={profile.experience} />
          </section>
        )}

        <div className="home__works">
          <h2 className="home-section__title">작업물</h2>
          <SearchBar initialQuery={query} onSearch={handleSearch} />
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
          {status === 'ready' && works.length > 0 && searching && groups.length === 0 && (
            <CharacterMessage message={`'${previewQuery(query)}'와 일치하는 작업물이 없어요`} />
          )}
          {works.length > 0 &&
            groups.map((group) => (
              // 검색어가 바뀌면 "더 보기"로 늘린 개수를 처음으로 돌린다.
              <CategorySection
                key={`${group.key}\n${query}`}
                id={group.id}
                name={group.label}
                tone={group.tone}
                works={group.works}
                categories={tones}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
