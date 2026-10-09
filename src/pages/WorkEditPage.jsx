import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkForm from '../components/WorkForm.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { fetchCategories } from '../services/categoriesService.js';
import { SAVE_ERROR_MESSAGES, saveWorkEdits } from '../services/workActions.js';
import { fetchWork } from '../services/worksService.js';

export default function WorkEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle('작업물 수정');
  const [work, setWork] = useState(null);
  const [categories, setCategories] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchWork(id), fetchCategories()])
      .then(([found, names]) => {
        if (cancelled) return;
        setWork(found);
        setCategories(names);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 상세 페이지가 목록의 검색어, 필터를 기억하고 있으면 그대로 넘긴다.
  const detailUrl = `/work/${id}`;
  const detailState = location.state;

  async function handleSubmit(values, pickedFile) {
    setSubmitting(true);
    setSubmitError('');
    try {
      await saveWorkEdits(work, values, pickedFile);
      navigate(detailUrl, { replace: true, state: detailState });
    } catch (error) {
      setSubmitError(SAVE_ERROR_MESSAGES[error.code] ?? SAVE_ERROR_MESSAGES.save);
      setSubmitting(false);
    }
  }

  return (
    <main className="container page page--narrow">
      <h1 className="page__title">작업물 수정</h1>
      {status === 'loading' && <CharacterMessage message="불러오는 중" role="status" />}
      {status === 'error' && <CharacterMessage message="작업물을 불러오지 못했어요. 새로고침해 주세요" role="alert" />}
      {status === 'missing' && (
        <CharacterMessage message="작업물을 찾을 수 없어요">
          <Link to="/" className="button">
            목록으로
          </Link>
        </CharacterMessage>
      )}
      {status === 'ready' && (
        <WorkForm
          initialValues={{
            title: work.title,
            description: work.description,
            category: work.category,
            newCategory: '',
            linkUrl: work.linkUrl,
            date: work.date,
          }}
          initialThumbnailUrl={work.thumbnailUrl}
          categories={categories}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          cancelTo={detailUrl}
          cancelState={detailState}
        />
      )}
    </main>
  );
}
