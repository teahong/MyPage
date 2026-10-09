import { useEffect, useRef, useState } from 'react';
import { signInWithPin } from '../services/authService.js';
import TurnstileWidget from './TurnstileWidget.jsx';

const PIN_LENGTH = 6;

const ERROR_MESSAGES = {
  wrong: 'PIN이 맞지 않아요. 다시 입력해 주세요',
  rate_limit: '시도가 너무 많아요. 잠시 후 다시 시도해 주세요',
  captcha: '로봇 확인에 실패했어요. 다시 시도해 주세요',
  unknown: '로그인하지 못했어요. 다시 시도해 주세요',
  widget: '로봇 확인을 불러오지 못했어요. 새로고침해 주세요',
};

// 열릴 때만 렌더링한다. 6자리를 다 입력하고 Turnstile 토큰이 있으면 바로 로그인을 시도한다.
export default function PinDialog({ onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const turnstileRef = useRef(null);
  const [pin, setPin] = useState('');
  const [token, setToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || !token || submitting) return;

    setSubmitting(true);
    setErrorCode(null);
    signInWithPin(pin, token)
      .then(onClose)
      .catch((err) => {
        setErrorCode(err.code in ERROR_MESSAGES ? err.code : 'unknown');
        setPin('');
        turnstileRef.current.reset();
        setSubmitting(false);
        inputRef.current?.focus();
      });
  }, [pin, token, submitting, onClose]);

  function handleChange(event) {
    setPin(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH));
  }

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  const error = errorCode && ERROR_MESSAGES[errorCode];
  const waitingForCheck = pin.length === PIN_LENGTH && !token && !submitting;

  return (
    <dialog ref={dialogRef} className="dialog" aria-labelledby="pin-dialog-title" onCancel={handleCancel}>
      <form className="pin-form" onSubmit={(event) => event.preventDefault()}>
        <h2 id="pin-dialog-title" className="dialog__title">
          관리자 로그인
        </h2>
        <label className="pin-form__label" htmlFor="admin-pin">
          PIN 6자리를 입력해 주세요
        </label>
        <input
          ref={inputRef}
          id="admin-pin"
          className="pin-form__input"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={handleChange}
          disabled={submitting}
          aria-invalid={errorCode === 'wrong' ? true : undefined}
          aria-describedby="pin-dialog-status"
          autoFocus
        />
        <TurnstileWidget
          ref={turnstileRef}
          onToken={setToken}
          onError={() => setErrorCode('widget')}
        />
        <p id="pin-dialog-status" className={error ? 'form-error' : 'form-hint'} role="status">
          {error || (submitting && '확인하는 중이에요') || (waitingForCheck && '로봇 확인을 기다리는 중이에요')}
        </p>
        <div className="dialog__actions">
          <button type="button" className="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </form>
    </dialog>
  );
}
