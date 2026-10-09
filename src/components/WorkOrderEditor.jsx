import { useState } from 'react';
import { SAVE_ERROR_MESSAGES, saveCategoryOrder } from '../services/workActions.js';
import formatDate from '../utils/formatDate.js';

// 한 카테고리의 작업물 순서를 바꾸는 관리자 화면. 위/아래/맨 위로 옮긴 뒤 저장한다.
export default function WorkOrderEditor({ works, onCancel, onSaved }) {
  const [order, setOrder] = useState(works);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  function move(from, to) {
    if (to < 0 || to >= order.length || to === from) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
    setAnnouncement(`${item.title}, ${to + 1}번째로 옮겼어요`);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await saveCategoryOrder(order.map((work) => work.id));
      await onSaved();
    } catch (saveError) {
      setError(SAVE_ERROR_MESSAGES[saveError.code] ?? SAVE_ERROR_MESSAGES.order);
      setSaving(false);
    }
  }

  const buttons = (work, index) => [
    { label: '맨 위로', symbol: '⤒', disabled: index === 0, to: 0 },
    { label: '위로', symbol: '↑', disabled: index === 0, to: index - 1 },
    { label: '아래로', symbol: '↓', disabled: index === order.length - 1, to: index + 1 },
  ];

  return (
    <div className="order-editor">
      <p className="form-hint">위에 있을수록 먼저 보여요</p>
      <ol className="order-list">
        {order.map((work, index) => (
          <li key={work.id} className="order-item">
            <span className="order-item__rank">{index + 1}</span>
            <img className="order-item__thumb" src={work.thumbnailUrl} alt="" />
            <span className="order-item__text">
              <span className="order-item__title">{work.title}</span>
              <time className="order-item__date" dateTime={work.date}>
                {formatDate(work.date)}
              </time>
            </span>
            <span className="order-item__actions">
              {/* 끝에 닿아도 disabled로 바꾸지 않는다. 누르던 버튼에서 키보드 초점이 사라지지 않게. */}
              {buttons(work, index).map(({ label, symbol, disabled, to }) => (
                <button
                  key={label}
                  type="button"
                  className="icon-button"
                  aria-label={`${work.title} ${label}`}
                  title={label}
                  aria-disabled={disabled}
                  onClick={() => move(index, to)}
                >
                  {symbol}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="order-editor__actions">
        <button type="button" className="button" onClick={onCancel} disabled={saving}>
          취소
        </button>
        <button type="button" className="button button--primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장하는 중' : '순서 저장'}
        </button>
      </div>
    </div>
  );
}
