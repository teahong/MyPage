# 작업물 아카이브

명세: `docs/개발문서.md` (8장 수용 기준 이후가 잘려 있음. 원본 받으면 보충).
구현은 문서 7.2 순서대로, 단계마다 실행해서 확인한 뒤 다음 단계로 넘어간다.

## 백엔드: Firebase 대신 Supabase (2026-10-09 사용자 결정)
문서는 Firebase 기준이지만 DB, 파일 저장, 로그인을 모두 Supabase로 바꿨다. 문서를 읽을 때 아래처럼 바꿔 읽는다.
- Firestore → Postgres 테이블 `works`, `categories`. 컬럼은 snake_case, 앱 객체는 camelCase(`worksService`에서 변환).
- Security Rules(문서 4.3) → `supabase/schema.sql`의 RLS 정책과 `public.is_admin()`. 사용자가 SQL Editor에 붙여넣어 실행한다.
- Firebase Storage → Supabase Storage 공개 버킷 `thumbnails` (5MB, jpg/png/webp 제한은 버킷 설정).
- Google 로그인(문서 3.6) → 6자리 PIN 로그인 (2026-10-09 사용자 결정). 아래 "관리자 PIN 로그인" 참고.
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ADMIN_EMAIL`, `VITE_TURNSTILE_SITE_KEY` (4개). Vercel에도 이 4개.
- `firebase/` 폴더 대신 `supabase/` 폴더 (`schema.sql`, `test-seed.sql`).

## 관리자 PIN 로그인 (문서 3.6 대체)
- Supabase Auth 이메일+비밀번호 로그인을 쓰고, 비밀번호가 6자리 숫자 PIN이다. 화면에는 PIN 입력칸만 보인다.
- 앱은 `signInWithPassword({ email: VITE_ADMIN_EMAIL, password: pin })`를 호출한다. 이메일은 번들에 공개되므로 PIN만이 비밀이다.
- 관리자 계정은 사용자가 대시보드 Authentication > Users > Add user로 직접 만든다 (Auto Confirm). 공개 회원가입은 꺼 둔다.
- 무차별 대입 방어는 두 겹 (2026-10-09 사용자 결정). 앱에 자체 잠금 로직은 만들지 않는다 (클라이언트 잠금은 우회 가능).
  1. Supabase Auth의 IP별 로그인 횟수 제한을 기본값보다 낮춘다 (대시보드 설정, 사용자가 수행).
  2. Cloudflare Turnstile 캡차. Supabase Auth의 Captcha protection을 켜서 서버가 토큰을 검증한다. 앱은 PIN 창에 위젯을 띄우고 `signInWithPassword({ ..., options: { captchaToken } })`로 토큰을 넘긴다. 토큰은 한 번 쓰면 끝이므로 시도마다 위젯을 리셋한다.
- Turnstile 스크립트는 `https://challenges.cloudflare.com/turnstile/v0/api.js`에서 직접 불러온다 (별도 npm 패키지 없음). 사이트 키는 `VITE_TURNSTILE_SITE_KEY`, 비밀 키는 Supabase 대시보드에만 넣는다 (앱/저장소에 두지 않음).
- Turnstile 허용 호스트: `localhost`와 Vercel 배포 도메인. 배포 도메인이 생기면 Cloudflare에 추가해야 로그인된다.
- 헤더 "관리자 로그인" → PIN 입력 창(숫자 6자리, `inputMode="numeric"`, `autocomplete="current-password"`). 6자리를 다 입력하면 바로 로그인 시도.
- 오류 문구: 틀림 "PIN이 맞지 않아요. 다시 입력해 주세요" / 횟수 제한 "시도가 너무 많아요. 잠시 후 다시 시도해 주세요".
- 로그인 상태는 Supabase가 브라우저에 보관해 새로고침해도 유지된다.

## 구조 원칙 (문서 2.2)
- Supabase 호출은 `src/services/`에만 둔다.
- 색상, 간격, 그림자는 `src/styles/tokens.css`의 CSS 변수만 쓴다. 컴포넌트에 색상값 금지.
- 관리자 여부 판단은 `useAuth` 한 곳에서. 화면 표시용일 뿐, 실제 권한은 RLS.
- 환경변수는 `VITE_` 접두사. `.env`는 커밋하지 않는다.
- `dangerouslySetInnerHTML` 금지. 외부 링크는 `rel="noopener noreferrer"`.
- UI 문구는 해요체, 40자 이내, 영어 에러 노출 금지. 문서 5.1 "AI 티 나는 기본값 금지 목록" 준수.

## 확정한 기본값 (문서에 없거나 모호했던 부분)
- 프로젝트 루트: 이 폴더(`MyPage`) 자체. `archive-site/` 하위 폴더를 만들지 않는다.
- 사이트 이름: "작업물 아카이브" (임시).
- 캐릭터: 사용자 캐릭터 `src/image/profile.png` (2026-10-09 사용자 결정, 문서 5.1의 `assets/character.png` 대신 이 경로). 배경이 있는 세로 그림이라 헤더는 얼굴만 원형으로 확대, 안내 화면은 테두리 두른 만화 칸처럼 보여준다.
- 디자인 기준은 캐릭터 그림의 색과 화풍 (2026-10-09 사용자 결정): 크림색 종이 배경 `#F8EDDC`, 포인트 컬러는 칠판 청록 `#66B3B4`, 먹색 굵은 외곽선(`--color-outline`, 2px)과 번지지 않는 만화풍 그림자. 값은 `tokens.css` 주석에 출처와 대비 비율을 적어 둔다.
- 디자인 다듬기는 13단계(무한 스크롤) 뒤, 14단계 전에 따로 한다 (2026-10-09 사용자 결정). 사용자 의견: 검정 테두리 때문에 촌스러워 보인다. 그때까지 새 화면도 토큰만 써서 나중에 토큰 교체로 바꿀 수 있게 한다.
- 포인트 컬러 파생 토큰: 크림 배경 위 글자는 `--color-accent-text`, 포인트 컬러로 채운 버튼 위 글자는 `--color-on-accent` (대비 4.5:1 확보).
- 관리자 이메일: `.env`, `schema.sql`의 `is_admin()`, 대시보드 관리자 계정에 같은 값을 넣는다. 저장소의 SQL에는 자리표시 문자열을 둔다. 메일을 보내지 않으므로 실제로 받는 주소일 필요는 없다.
- 카테고리: `name`이 기본키. 대소문자 무시 중복은 DB 유니크 인덱스(`lower(name)`)가 막는다. 기본 3개는 `schema.sql`에서 미리 넣는다.
- `works.category`는 `categories.name` 외래키.
- 새 작업물은 `crypto.randomUUID()`로 id를 먼저 만들어 썸네일 경로 `{id}-{timestamp}.{ext}`(버킷 `thumbnails`)와 행 id에 같이 쓴다.
- 정렬(date desc, created_at desc)은 DB 쿼리에서 한다.
- 썸네일 리사이즈 결과: png는 png 유지(투명 배경), 그 외는 webp.
- 수정 시 기존 썸네일 삭제가 실패하면 콘솔 기록 후 진행.
- 필드 검증(길이, URL 형식)은 앱과 DB check 제약 양쪽에 둔다.
- 날짜는 Postgres `date` 타입. 앱에서는 `'YYYY-MM-DD'` 문자열로 다루고 `YYYY.MM.DD`로 표시한다.
- 검색어, 필터는 URL 쿼리(`?q=&category=`)에 담아 상세에서 돌아와도 유지한다.
- Pretendard는 npm 패키지로 설치한다.
- 테스트: `utils/`의 검증 함수만 Vitest 단위 테스트.

## 명령
- `npm run dev` 개발 서버 (localhost:5173)
- `npm run build` 빌드
