import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { fetchLinkImage } from '../services/linkImageService.js';
import {
  CATEGORY_NAME_MAX,
  DESCRIPTION_MAX,
  NEW_CATEGORY,
  TITLE_MAX,
  validateLinkUrl,
  validateThumbnail,
  validateWork,
} from '../utils/validators.js';

const ACCEPT = 'image/jpeg,image/png,image/webp';

// 추가, 수정 화면이 같이 쓰는 입력 폼.
// 썸네일은 선택이다. 고르지 않으면 저장할 때 링크의 대표 이미지나 제목 카드를 넣는다.
// initialThumbnailUrl이 있으면(수정) 썸네일은 새로 골랐을 때만 바꾼다.
// onSubmit(values, thumbnailFile | null)
export default function WorkForm({
  initialValues,
  initialThumbnailUrl = '',
  categories,
  submitting,
  submitError,
  onSubmit,
  cancelTo,
  cancelState,
}) {
  const [values, setValues] = useState(initialValues);
  // { file, source: 'upload' | 'link' } 또는 null(자동)
  const [thumbnail, setThumbnail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialThumbnailUrl);
  const [linkImageStatus, setLinkImageStatus] = useState('idle'); // idle | loading | failed
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // 미리보기용 임시 주소는 바뀌거나 화면을 떠날 때 해제한다.
  useEffect(() => {
    if (!thumbnail) {
      setPreviewUrl(initialThumbnailUrl);
      return undefined;
    }
    const url = URL.createObjectURL(thumbnail.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail, initialThumbnailUrl]);

  function setField(name) {
    return (event) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
      // 링크를 바꾸면 이전 링크에서 가져온 이미지는 더 이상 맞지 않는다.
      if (name === 'linkUrl') {
        setLinkImageStatus('idle');
        setThumbnail((prev) => (prev?.source === 'link' ? null : prev));
      }
    };
  }

  function handleFileChange(event) {
    const picked = event.target.files[0] ?? null;
    event.target.value = '';
    if (!picked) return;
    const message = validateThumbnail(picked);
    setErrors((prev) => ({ ...prev, thumbnail: message }));
    if (message) return;
    setLinkImageStatus('idle');
    setThumbnail({ file: picked, source: 'upload' });
  }

  async function handleFetchLinkImage() {
    const linkError = validateLinkUrl(values.linkUrl);
    if (linkError) {
      setErrors((prev) => ({ ...prev, linkUrl: linkError }));
      formRef.current.querySelector('[name="linkUrl"]')?.focus();
      return;
    }
    setLinkImageStatus('loading');
    setErrors((prev) => ({ ...prev, thumbnail: '' }));
    const file = await fetchLinkImage(values.linkUrl);
    if (!file) {
      setLinkImageStatus('failed');
      return;
    }
    setLinkImageStatus('idle');
    setThumbnail({ file, source: 'link' });
  }

  function handleClearThumbnail() {
    setThumbnail(null);
    setLinkImageStatus('idle');
    setErrors((prev) => ({ ...prev, thumbnail: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting || linkImageStatus === 'loading') return;
    const file = thumbnail?.file ?? null;
    // 링크에서 가져온 이미지는 서버가 형식을 확인했고 저장 전에 줄이므로 직접 올린 파일만 검사한다.
    const found = validateWork(values, thumbnail?.source === 'upload' ? file : null, { categories });
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit(values, file);
  }

  const thumbnailStatus =
    linkImageStatus === 'loading'
      ? '대표 이미지를 가져오는 중이에요'
      : linkImageStatus === 'failed'
        ? '링크에서 대표 이미지를 찾지 못했어요'
        : thumbnail?.source === 'link'
          ? '링크의 대표 이미지예요'
          : thumbnail?.source === 'upload'
            ? '직접 올린 이미지예요'
            : initialThumbnailUrl
              ? '지금 쓰고 있는 썸네일이에요'
              : '';

  const fieldProps = (name) => ({
    id: `work-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `work-${name}-error` : undefined,
  });

  const errorText = (name) =>
    errors[name] ? (
      <p id={`work-${name}-error`} className="form-error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form ref={formRef} className="work-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor="work-title">
          제목
        </label>
        <input
          {...fieldProps('title')}
          className="field__input"
          type="text"
          maxLength={TITLE_MAX}
          value={values.title}
          onChange={setField('title')}
        />
        {errorText('title')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="work-description">
          설명
        </label>
        <textarea
          {...fieldProps('description')}
          className="field__input field__input--textarea"
          rows={6}
          maxLength={DESCRIPTION_MAX}
          value={values.description}
          onChange={setField('description')}
        />
        {errorText('description')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="work-category">
          카테고리
        </label>
        <select {...fieldProps('category')} className="field__input" value={values.category} onChange={setField('category')}>
          <option value="">골라 주세요</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={NEW_CATEGORY}>새 카테고리 추가</option>
        </select>
        {errorText('category')}
        {values.category === NEW_CATEGORY && (
          <>
            <label className="field__label field__label--sub" htmlFor="work-newCategory">
              새 카테고리 이름
            </label>
            <input
              {...fieldProps('newCategory')}
              className="field__input"
              type="text"
              maxLength={CATEGORY_NAME_MAX}
              value={values.newCategory ?? ''}
              onChange={setField('newCategory')}
              autoFocus
            />
            {errorText('newCategory')}
          </>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="work-linkUrl">
          링크 주소
        </label>
        <input
          {...fieldProps('linkUrl')}
          className="field__input"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={values.linkUrl}
          onChange={setField('linkUrl')}
        />
        {errorText('linkUrl')}
      </div>

      <div className="field" role="group" aria-labelledby="work-thumbnail-label">
        <span id="work-thumbnail-label" className="field__label">
          썸네일
        </span>
        <p className="field__hint">
          {initialThumbnailUrl
            ? '새로 고르지 않으면 지금 썸네일을 그대로 써요'
            : '비워 두면 링크의 대표 이미지나 제목 카드를 넣어요'}
        </p>
        <div className="field__preview">
          {previewUrl ? (
            <img src={previewUrl} alt="썸네일 미리보기" />
          ) : (
            <p className="field__preview-empty">저장할 때 자동으로 넣어요</p>
          )}
        </div>
        <p className={linkImageStatus === 'failed' ? 'form-error' : 'field__hint'} role="status">
          {thumbnailStatus}
        </p>
        <div className="field__actions">
          <button
            type="button"
            className="button"
            onClick={handleFetchLinkImage}
            disabled={linkImageStatus === 'loading' || submitting}
          >
            {linkImageStatus === 'loading' ? '가져오는 중' : '링크에서 가져오기'}
          </button>
          <input
            ref={fileInputRef}
            {...fieldProps('thumbnail')}
            className="visually-hidden"
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            tabIndex={-1}
          />
          <button
            type="button"
            className="button"
            onClick={() => fileInputRef.current.click()}
            disabled={submitting}
          >
            사진 올리기
          </button>
          {thumbnail && (
            <button type="button" className="text-button" onClick={handleClearThumbnail} disabled={submitting}>
              {initialThumbnailUrl ? '원래대로' : '비우기'}
            </button>
          )}
        </div>
        <p className="field__hint">직접 올릴 때는 jpg, png, webp, 5MB 이하</p>
        {errorText('thumbnail')}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="work-date">
          날짜
        </label>
        <input
          {...fieldProps('date')}
          className="field__input field__input--date"
          type="date"
          value={values.date}
          onChange={setField('date')}
        />
        {errorText('date')}
      </div>

      {/* 입력 칸 오류를 고치는 중에는 지난 저장 실패 문구를 숨긴다 */}
      {submitError && !Object.values(errors).some(Boolean) && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="work-form__actions">
        <Link to={cancelTo} state={cancelState} className="button">
          취소
        </Link>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? '저장 중' : '저장'}
        </button>
      </div>
    </form>
  );
}
