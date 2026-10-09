import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkForm from '../components/WorkForm.jsx';
import { fetchCategories } from '../services/categoriesService.js';
import { deleteThumbnail, uploadThumbnail } from '../services/storageService.js';
import { createWork } from '../services/worksService.js';
import { today } from '../utils/formatDate.js';
import resizeImage from '../utils/imageResize.js';

const EMPTY_VALUES = { title: '', description: '', category: '', linkUrl: '', date: '' };

export default function WorkNewPage() {
  const navigate = useNavigate();
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

  // 썸네일 업로드 → 공개 URL 확보 → 행 저장. 행 저장이 실패하면 올린 파일을 지운다.
  async function handleSubmit(values, file) {
    setSubmitting(true);
    setSubmitError('');
    const id = crypto.randomUUID();
    let thumbnail = null;
    try {
      thumbnail = await uploadThumbnail(id, await resizeImage(file));
      await createWork(id, values, thumbnail);
      // 상세 페이지(/work/:id)는 10단계에서 만든다. 그때 저장 후 이동할 곳을 상세로 바꾼다.
      navigate('/');
    } catch (error) {
      console.error(error);
      if (thumbnail) {
        deleteThumbnail(thumbnail.path).catch((cleanupError) => console.error(cleanupError));
      }
      setSubmitError(thumbnail ? '저장하지 못했어요. 다시 시도해 주세요' : '썸네일을 올리지 못했어요. 다시 시도해 주세요');
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
