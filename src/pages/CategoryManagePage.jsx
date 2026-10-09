import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import CategoryLabel from '../components/CategoryLabel.jsx';
import CharacterMessage from '../components/CharacterMessage.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useWorks from '../hooks/useWorks.js';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  saveCategoryOrder,
} from '../services/categoriesService.js';
import { CATEGORY_NAME_MAX, validateCategoryName } from '../utils/validators.js';

const ERROR_MESSAGES = {
  load: '카테고리를 불러오지 못했어요. 새로고침해 주세요',
  add: '카테고리를 추가하지 못했어요. 다시 시도해 주세요',
  duplicate: '이미 있는 카테고리예요',
  delete: '카테고리를 지우지 못했어요. 다시 시도해 주세요',
  in_use: '작업물이 있는 카테고리는 지울 수 없어요',
  order: '순서를 저장하지 못했어요. 다시 시도해 주세요',
};

// 카테고리 추가, 삭제, 순서 바꾸기 (관리자). 추가와 삭제는 바로 저장하고,
// 순서는 옮긴 뒤 "순서 저장"을 눌러야 저장한다.
export default function CategoryManagePage() {
  useDocumentTitle('카테고리 관리');
  const { works, status: worksStatus } = useWorks();
  const [saved, setSaved] = useState(null); // DB에 저장된 순서
  const [order, setOrder] = useState(null); // 화면에서 옮기는 중인 순서
  const [loadFailed, setLoadFailed] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    fetchCategories()
      .then((names) => {
        setSaved(names);
        setOrder(names);
      })
      .catch((loadError) => {
        console.error(loadError);
        setLoadFailed(true);
      });
  }, []);

  const counts = new Map();
  for (const work of works) counts.set(work.category, (counts.get(work.category) ?? 0) + 1);
  const dirty = order !== null && order.join('\n') !== saved.join('\n');

  function move(from, to) {
    if (to < 0 || to >= order.length || to === from) return;
    const next = [...order];
    const [name] = next.splice(from, 1);
    next.splice(to, 0, name);
    setOrder(next);
    setAnnouncement(`${name}, ${to + 1}번째로 옮겼어요`);
  }

  async function run(task, fallbackCode) {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (taskError) {
      console.error(taskError);
      setError(ERROR_MESSAGES[taskError.code] ?? ERROR_MESSAGES[fallbackCode]);
    } finally {
      setBusy(false);
    }
  }

  function handleSaveOrder() {
    run(async () => {
      await saveCategoryOrder(order);
      setSaved(order);
      setAnnouncement('순서를 저장했어요');
    }, 'order');
  }

  function handleDelete(name) {
    if ((counts.get(name) ?? 0) > 0) {
      setError(ERROR_MESSAGES.in_use);
      return;
    }
    run(async () => {
      await deleteCategory(name);
      setSaved((prev) => prev.filter((item) => item !== name));
      setOrder((prev) => prev.filter((item) => item !== name));
      setAnnouncement(`${name} 카테고리를 지웠어요`);
    }, 'delete');
  }

  function handleAdd(event) {
    event.preventDefault();
    const lower = newName.trim().toLowerCase();
    const duplicate = order.some((item) => item.toLowerCase() === lower);
    const message = duplicate ? ERROR_MESSAGES.duplicate : validateCategoryName(newName, order);
    if (message) {
      setNameError(message);
      return;
    }
    const name = newName.trim();
    setNameError('');
    run(async () => {
      await createCategory(name);
      // 새 카테고리는 순서가 없어서 맨 뒤에 온다.
      setSaved((prev) => [...prev, name]);
      setOrder((prev) => [...prev, name]);
      setNewName('');
      setAnnouncement(`${name} 카테고리를 추가했어요`);
    }, 'add');
  }

  return (
    <main className="container page page--narrow">
      <Link to="/" className="back-link">
        목록으로
      </Link>
      <h1 className="page__title">카테고리 관리</h1>
      {loadFailed && <CharacterMessage message={ERROR_MESSAGES.load} role="alert" />}
      {!loadFailed && !order && <CharacterMessage message="불러오는 중" role="status" />}
      {order && (
        <>
          <p className="form-hint">위에 있을수록 첫 페이지에서 먼저 보여요. 색도 순서대로 정해져요</p>
          <ol className="order-list">
            {order.map((name, index) => {
              const count = counts.get(name) ?? 0;
              const countText = worksStatus === 'ready' ? `작업물 ${count}개` : '';
              return (
                <li key={name} className="order-item">
                  <span className="order-item__rank">{index + 1}</span>
                  <span className="order-item__text">
                    <span>
                      <CategoryLabel name={name} categories={order} />
                    </span>
                    <span className="order-item__date">{countText}</span>
                  </span>
                  <span className="order-item__actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${name} 위로`}
                      title="위로"
                      aria-disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${name} 아래로`}
                      title="아래로"
                      aria-disabled={index === order.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      ↓
                    </button>
                    {/* 작업물이 있으면 지울 수 없다 (DB 외래키도 막는다). 목록을 불러오기 전에는 누를 수 없다. */}
                    <button
                      type="button"
                      className="button button--danger-outline"
                      aria-label={`${name} 삭제`}
                      aria-disabled={worksStatus !== 'ready' || count > 0 || busy}
                      onClick={() => worksStatus === 'ready' && !busy && handleDelete(name)}
                    >
                      삭제
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="visually-hidden" aria-live="polite">
            {announcement}
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {dirty && (
            <div className="order-editor__actions">
              <button type="button" className="button" onClick={() => setOrder(saved)} disabled={busy}>
                되돌리기
              </button>
              <button type="button" className="button button--primary" onClick={handleSaveOrder} disabled={busy}>
                {busy ? '저장하는 중' : '순서 저장'}
              </button>
            </div>
          )}

          <form className="category-add" onSubmit={handleAdd} noValidate>
            <label className="field__label" htmlFor="new-category">
              새 카테고리
            </label>
            <div className="category-add__row">
              <input
                id="new-category"
                className="field__input"
                value={newName}
                maxLength={CATEGORY_NAME_MAX}
                onChange={(event) => setNewName(event.target.value)}
                aria-invalid={nameError ? 'true' : undefined}
                aria-describedby={nameError ? 'new-category-error' : undefined}
                autoComplete="off"
              />
              <button type="submit" className="button button--primary" disabled={busy}>
                추가
              </button>
            </div>
            {nameError && (
              <p id="new-category-error" className="form-error" role="alert">
                {nameError}
              </p>
            )}
          </form>
        </>
      )}
    </main>
  );
}
