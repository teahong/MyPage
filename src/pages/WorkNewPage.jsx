import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import WorkForm from '../components/WorkForm.jsx';
import { createCategory, fetchCategories } from '../services/categoriesService.js';
import { fetchLinkImage } from '../services/linkImageService.js';
import { deleteThumbnail, uploadThumbnail } from '../services/storageService.js';
import { createWork } from '../services/worksService.js';
import { today } from '../utils/formatDate.js';
import resizeImage from '../utils/imageResize.js';
import createTitleCard from '../utils/titleCard.js';
import { NEW_CATEGORY } from '../utils/validators.js';

// 고른 이미지 → 링크의 대표 이미지 → 제목 카드 순서로 정하고 업로드할 크기로 줄인다.
// 링크 이미지는 찾지 못하거나 브라우저가 열지 못하면 건너뛴다.
async function prepareThumbnail(values, pickedFile) {
  if (pickedFile) return resizeImage(pickedFile);
  const linkImage = await fetchLinkImage(values.linkUrl);
  if (linkImage) {
    try {
      return await resizeImage(linkImage);
    } catch (error) {
      console.error(error);
    }
  }
  return resizeImage(await createTitleCard({ title: values.title.trim(), category: values.category }));
}

const EMPTY_VALUES = { title: '', description: '', category: '', newCategory: '', linkUrl: '', date: '' };

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

  // (새 카테고리 저장) → 썸네일 정하기 → 업로드 → 공개 URL 확보 → 행 저장.
  // 행 저장이 실패하면 올린 파일을 지운다.
  async function handleSubmit(formValues, pickedFile) {
    setSubmitting(true);
    setSubmitError('');

    let values = formValues;
    if (formValues.category === NEW_CATEGORY) {
      const name = formValues.newCategory.trim();
      try {
        await createCategory(name);
      } catch (error) {
        console.error(error);
        setSubmitError(
          error.code === 'duplicate'
            ? '이미 있는 카테고리예요. 목록에서 골라 주세요'
            : '카테고리를 저장하지 못했어요. 다시 시도해 주세요',
        );
        setSubmitting(false);
        return;
      }
      values = { ...formValues, category: name };
    }

    const id = crypto.randomUUID();
    let thumbnail = null;
    try {
      thumbnail = await uploadThumbnail(id, await prepareThumbnail(values, pickedFile));
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
