import { useEffect, useRef, useState } from 'react';
import { signInWithPin } from '../services/authService.js';
import { PIN_ERROR_MESSAGES, PIN_LENGTH } from './pinMessages.js';
import TurnstileWidget from './TurnstileWidget.jsx';

// 작업물 삭제 확인 창. PIN과 로봇 확인으로 다시 인증한 뒤 onDelete를 부른다.
// DB도 최근 5분 안에 PIN으로 인증한 경우에만 삭제를 허용한다 (schema.sql의 has_recent_pin_auth).
// onDelete가 실패하면 화면 문구를 message로 담은 Error를 던진다. 열릴 때만 렌더링한다.
export default function DeleteWorkDialog({ onDelete, onCancel }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const turnstileRef = useRef(null);
  const [pin, setPin] = useState('');
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wrongPin, setWrongPin] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    inputRef.current.focus();
    return () => dialog.close();
  }, []);

  function handleCancel(event) {
    event.preventDefault();
    if (!busy) onCancel();
  }

  function handleChange(event) {
    setPin(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
    setWrongPin(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || pin.length !== PIN_LENGTH || !token) return;
    setBusy(true);
    setError('');
    try {
      await signInWithPin(pin, token);
    } catch (err) {
      setError(PIN_ERROR_MESSAGES[err.code] ?? PIN_ERROR_MESSAGES.unknown);
      setWrongPin(err.code === 'wrong');
      setPin('');
      turnstileRef.current.reset();
      setBusy(false);
      inputRef.current?.focus();
      return;
    }
    try {
      await onDelete();
    } catch (err) {
      setError(err.message);
      setPin('');
      turnstileRef.current.reset();
      setBusy(false);
    }
  }

  const ready = pin.length === PIN_LENGTH && token && !busy;

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      role="alertdialog"
      aria-labelledby="delete-dialog-message"
      onCancel={handleCancel}
    >
      <form className="pin-form" onSubmit={handleSubmit}>
        <p id="delete-dialog-message" className="dialog__message">
          정말 삭제할까요? 되돌릴 수 없어요.
        </p>
        <label className="pin-form__label" htmlFor="delete-pin">
          삭제하려면 PIN 6자리를 입력해 주세요
        </label>
        <input
          ref={inputRef}
          id="delete-pin"
          className="pin-form__input"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={handleChange}
          disabled={busy}
          aria-invalid={wrongPin ? true : undefined}
          aria-describedby="delete-dialog-status"
        />
        <TurnstileWidget ref={turnstileRef} onToken={setToken} onError={() => setError(PIN_ERROR_MESSAGES.widget)} />
        <p id="delete-dialog-status" className={error ? 'form-error' : 'form-hint'} role="status">
          {error ||
            (busy && '삭제하는 중이에요') ||
            (pin.length === PIN_LENGTH && !token && '로봇 확인을 기다리는 중이에요')}
        </p>
        <div className="dialog__actions">
          <button type="button" className="button" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button type="submit" className="button button--danger" disabled={!ready}>
            {busy ? '삭제 중' : '삭제'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
