import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DESCRIPTION_MAX, TITLE_MAX, validateThumbnail, validateWork } from '../utils/validators.js';

const ACCEPT = 'image/jpeg,image/png,image/webp';

// 추가, 수정 화면이 같이 쓰는 입력 폼.
// initialThumbnailUrl이 있으면(수정) 썸네일은 새로 골랐을 때만 바꾼다.
export default function WorkForm({
  initialValues,
  initialThumbnailUrl = '',
  categories,
  submitting,
  submitError,
  onSubmit,
  cancelTo,
}) {
  const [values, setValues] = useState(initialValues);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialThumbnailUrl);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const requireThumbnail = !initialThumbnailUrl;

  // 미리보기용 임시 주소는 바뀌거나 화면을 떠날 때 해제한다.
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function setField(name) {
    return (event) => {
      setValues((prev) => ({ ...prev, [name]: event.target.value }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    };
  }

  function handleFileChange(event) {
    const picked = event.target.files[0] ?? null;
    const message = validateThumbnail(picked, { required: requireThumbnail });
    setErrors((prev) => ({ ...prev, thumbnail: message }));
    if (message) {
      event.target.value = '';
      setFile(null);
      setPreviewUrl(initialThumbnailUrl);
      return;
    }
    setFile(picked);
    if (!picked) setPreviewUrl(initialThumbnailUrl);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const found = validateWork(values, file, { requireThumbnail });
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit(values, file);
  }

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
        </select>
        {errorText('category')}
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

      <div className="field">
        <label className="field__label" htmlFor="work-thumbnail">
          썸네일
        </label>
        <p className="field__hint">jpg, png, webp 이미지, 5MB 이하</p>
        {previewUrl && (
          <div className="field__preview">
            <img src={previewUrl} alt="썸네일 미리보기" />
          </div>
        )}
        <input {...fieldProps('thumbnail')} className="field__file" type="file" accept={ACCEPT} onChange={handleFileChange} />
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

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="work-form__actions">
        <Link to={cancelTo} className="button">
          취소
        </Link>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? '저장 중' : '저장'}
        </button>
      </div>
    </form>
  );
}
