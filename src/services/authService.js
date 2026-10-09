import { supabase } from './supabase.js';

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

// 관리자 이메일은 번들에 공개된다. PIN(비밀번호)과 Turnstile 토큰만 서버가 검증한다.
// 실패 시 화면 문구를 고를 수 있도록 code를 붙여 던진다: wrong | rate_limit | captcha | unknown
export async function signInWithPin(pin, captchaToken) {
  const { error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: pin,
    options: { captchaToken },
  });
  if (!error) return;

  console.error(error);
  const code =
    error.code === 'invalid_credentials'
      ? 'wrong'
      : error.code === 'over_request_rate_limit' || error.status === 429
        ? 'rate_limit'
        : error.code === 'captcha_failed'
          ? 'captcha'
          : 'unknown';
  throw Object.assign(new Error(error.message), { code });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error(error);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// 반환값은 구독 해제 함수.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
