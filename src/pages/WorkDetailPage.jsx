import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { fetchWork } from '../services/worksService.js';
import formatDate from '../utils/formatDate.js';

export default function WorkDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [work, setWork] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchWork(id)
      .then((found) => {
        if (cancelled) return;
        setWork(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  useDocumentTitle(status === 'ready' ? work.title : '');

  // 목록에서 들어왔으면 그때의 검색어, 필터로 돌아간다.
  const listUrl = `/${location.state?.listSearch ?? ''}`;

  if (status === 'loading') {
    return (
      <main className="container page">
        <CharacterMessage message="불러오는 중" role="status" />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="container page">
        <CharacterMessage message="작업물을 불러오지 못했어요" role="alert">
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            다시 시도
          </button>
        </CharacterMessage>
      </main>
    );
  }

  if (status === 'missing') {
    return (
      <main className="container page">
        <CharacterMessage message="작업물을 찾을 수 없어요">
          <Link to={listUrl} className="button">
            목록으로
          </Link>
        </CharacterMessage>
      </main>
    );
  }

  return (
    <main className="container page page--detail">
      <Link to={listUrl} className="back-link">
        목록으로
      </Link>
      <article className="work-detail">
        {/* 썸네일을 눌러도 작업물이 열린다. 키보드, 보조기기에는 아래 "작업물 열기" 버튼 하나만 보이게 한다 */}
        <a
          className="work-detail__thumb"
          href={work.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img src={work.thumbnailUrl} alt="" />
        </a>
        <p className="work-card__meta">
          <span className="work-card__category">{work.category}</span>
          <time dateTime={work.date}>{formatDate(work.date)}</time>
        </p>
        <h1 className="work-detail__title">{work.title}</h1>
        <p className="work-detail__description">{work.description}</p>
        <div className="work-detail__actions">
          <a className="button button--primary" href={work.linkUrl} target="_blank" rel="noopener noreferrer">
            작업물 열기
          </a>
        </div>
      </article>
    </main>
  );
}
