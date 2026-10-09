import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkForm from '../components/WorkForm.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { fetchCategories } from '../services/categoriesService.js';
import { SAVE_ERROR_MESSAGES, saveNewWork } from '../services/workActions.js';
import { today } from '../utils/formatDate.js';

const EMPTY_VALUES = { title: '', description: '', category: '', newCategory: '', linkUrl: '', date: '' };

export default function WorkNewPage() {
  const navigate = useNavigate();
  useDocumentTitle('작업물 추가');
  const [categories, setCategories] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => {
        console.error(error);
        setLoadFailed(true);
      });
  }, []);

  async function handleSubmit(values, pickedFile) {
    setSubmitting(true);
    setSubmitError('');
    try {
      const id = await saveNewWork(values, pickedFile);
      navigate(`/work/${id}`, { replace: true });
    } catch (error) {
      setSubmitError(SAVE_ERROR_MESSAGES[error.code] ?? SAVE_ERROR_MESSAGES.save);
      setSubmitting(false);
    }
  }

  return (
    <main className="container page page--narrow">
      <h1 className="page__title">작업물 추가</h1>
      {loadFailed && <CharacterMessage message="카테고리를 불러오지 못했어요. 새로고침해 주세요" role="alert" />}
      {!loadFailed && !categories && <CharacterMessage message="불러오는 중" role="status" />}
      {categories && (
        <WorkForm
          initialValues={{ ...EMPTY_VALUES, date: today() }}
          categories={categories}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          cancelTo="/"
        />
      )}
    </main>
  );
}
