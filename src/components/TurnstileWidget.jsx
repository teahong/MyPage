import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let scriptPromise = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      window.onTurnstileLoad = () => resolve(window.turnstile);
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('Turnstile 스크립트를 불러오지 못함'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// Cloudflare Turnstile 위젯. 토큰은 한 번만 쓸 수 있으므로 시도할 때마다 reset()한다.
// onToken(token | null): 토큰을 받거나 만료되면 호출. onError(): 위젯을 쓸 수 없을 때 호출.
const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken, onError }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const handlersRef = useRef({ onToken, onError });
  handlersRef.current = { onToken, onError };

  useImperativeHandle(ref, () => ({
    reset() {
      handlersRef.current.onToken(null);
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: 'ko',
          callback: (token) => handlersRef.current.onToken(token),
          'expired-callback': () => handlersRef.current.onToken(null),
          'error-callback': () => {
            handlersRef.current.onToken(null);
            handlersRef.current.onError();
          },
        });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) handlersRef.current.onError();
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="turnstile" />;
});

export default TurnstileWidget;
