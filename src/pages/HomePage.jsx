import { Link } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkGrid from '../components/WorkGrid.jsx';
import useAuth from '../hooks/useAuth.js';
import useWorks from '../hooks/useWorks.js';

export default function HomePage() {
  const { works, status, reload } = useWorks();
  const { isAdmin } = useAuth();

  return (
    <main className="container page">
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
      {status === 'ready' && works.length > 0 && <WorkGrid works={works} />}
    </main>
  );
}
