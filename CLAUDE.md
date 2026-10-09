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
- 작업물 삭제 전에 PIN을 다시 받는다 (2026-10-09 사용자 결정). `DeleteWorkDialog`가 PIN과 Turnstile로 `signInWithPassword`를 다시 호출한 뒤 삭제한다. DB도 restrictive 정책 "works delete needs recent pin"과 `public.has_recent_pin_auth()`로 토큰의 `amr`에 최근 5분 안의 password 인증이 있을 때만 삭제를 허용한다.

## 구조 원칙 (문서 2.2)
- Supabase 호출은 `src/services/`에만 둔다.
- 색상, 간격, 그림자는 `src/styles/tokens.css`의 CSS 변수만 쓴다. 컴포넌트에 색상값 금지.
- 관리자 여부 판단은 `useAuth` 한 곳에서. 화면 표시용일 뿐, 실제 권한은 RLS.
- 환경변수는 `VITE_` 접두사. `.env`는 커밋하지 않는다.
- `dangerouslySetInnerHTML` 금지. 외부 링크는 `rel="noopener noreferrer"`.
- UI 문구는 해요체, 40자 이내, 영어 에러 노출 금지. 문서 5.1 "AI 티 나는 기본값 금지 목록" 준수.

## 확정한 기본값 (문서에 없거나 모호했던 부분)
- 프로젝트 루트: 이 폴더(`MyPage`) 자체. `archive-site/` 하위 폴더를 만들지 않는다.
- 사이트 이름: "뽀글쌤" (2026-10-09 사용자 결정). 탭 제목은 `useDocumentTitle`의 `SITE_NAME`과 `index.html`, 캐릭터 대체 텍스트는 "뽀글쌤 캐릭터".
- 캐릭터: 사용자 캐릭터 `src/image/profile.png` (2026-10-09 사용자 결정, 문서 5.1의 `assets/character.png` 대신 이 경로). 배경이 있는 세로 그림이라 헤더는 얼굴만 원형으로 확대, 안내 화면은 테두리 두른 만화 칸처럼 보여준다.
- 디자인 기준은 캐릭터 그림의 색과 화풍 (2026-10-09 사용자 결정): 크림색 종이 배경 `#F8EDDC`, 포인트 컬러는 칠판 청록 `#66B3B4`, 먹색 굵은 외곽선(`--color-outline`, 2px)과 번지지 않는 만화풍 그림자. 값은 `tokens.css` 주석에 출처와 대비 비율을 적어 둔다.
- 디자인 다듬기 (2026-10-09, 13단계 뒤): 굵은 먹색 테두리와 만화풍 그림자를 걷어내고 옅은 선(`--color-outline`), 입력칸, 버튼은 `--color-control-border`(대비 3:1 이상), 부드러운 그림자로 바꿨다.
- 카테고리마다 다른 색 (2026-10-09 사용자 결정, 문서 5.1 "포인트 컬러 1개" 대체). 그림 속 색 7가지 `--category-1..7-bg/text`, 카테고리 목록 순서대로 배정(`utils/categoryTone.js`, 목록 불러오기 전에는 중립색 tone-0). 라벨은 `CategoryLabel`, 목차는 카테고리 색 선(넓은 화면) 또는 색 점 + 강조 시 그 색으로 채움(좁은 화면). 소개, 경력은 포인트 컬러.
- 배경에 캐릭터를 흐리게 깐다 (2026-10-09 사용자 결정, 문서 5.1 "blur 배경 금지" 대체). `base.css`의 `body::before`, 오른쪽 아래 고정, 투명도와 흐림은 `--backdrop-character-*` 토큰.
- 카테고리 목록은 `categoriesService.fetchCategories`가 한 번 불러와 재사용하고, 새 카테고리를 만들면 비운다. 화면에서는 `useCategories` 훅.
- 포인트 컬러 파생 토큰: 크림 배경 위 글자는 `--color-accent-text`, 포인트 컬러로 채운 버튼 위 글자는 `--color-on-accent` (대비 4.5:1 확보).
- 관리자 이메일: `.env`, DB의 `public.app_settings`(key `admin_email`), 대시보드 관리자 계정에 같은 값을 넣는다. `is_admin()`은 `app_settings`에서 읽는다(security definer). 저장소의 SQL에는 자리표시 문자열을 두고, 실행용은 `.env` 이메일을 채운 `supabase/schema.local.sql`(gitignore)로 만든다. `schema.sql`은 전체 재실행해도 저장된 이메일을 덮어쓰지 않는다. 메일을 보내지 않으므로 실제로 받는 주소일 필요는 없다.
- DB 변경을 안내할 때는 필요한 SQL 조각만 주거나, 전체가 필요하면 `schema.local.sql`을 다시 만들어 준다.
- 카테고리: `name`이 기본키. 대소문자 무시 중복은 DB 유니크 인덱스(`lower(name)`)가 막는다. 기본 3개는 `schema.sql`에서 미리 넣는다.
- 기본 카테고리는 "발표 자료", "소프트웨어", "출판물" (2026-10-09 사용자 결정. 문서의 "앱"→"소프트웨어", "웹사이트"→"출판물").
- 새 카테고리는 작업물을 저장할 때 같이 만든다 (카테고리 → 썸네일 → 작업물 순서).
- `works.category`는 `categories.name` 외래키.
- 새 작업물은 `crypto.randomUUID()`로 id를 먼저 만들어 썸네일 경로 `{id}-{timestamp}.{ext}`(버킷 `thumbnails`)와 행 id에 같이 쓴다.
- 정렬(date desc, created_at desc)은 DB 쿼리에서 한다.
- 썸네일 리사이즈 결과: png는 png 유지(투명 배경), 그 외는 webp.
- 썸네일은 필수가 아니다 (2026-10-09 사용자 결정, 문서 3.7 "썸네일 필수" 대체). 저장할 때 우선순위: 직접 올린 이미지 → 링크의 대표 이미지(og:image 등) → 제목 카드. 어느 경우든 리사이즈해서 우리 Storage에 올린다 (외부 이미지를 직접 걸지 않음). 폼에 "링크에서 가져오기"로 미리 볼 수 있다.
- 링크 대표 이미지는 Edge Function `supabase/functions/fetch-og-image`가 가져온다 (브라우저는 CORS로 못 읽음). 관리자만 호출 가능(함수 안에서 `is_admin()` 확인), `--no-verify-jwt`로 배포. 내부망 주소 차단, HTML 앞 2MB만 읽음. YouTube는 서버 IP에서 페이지를 막아서(429) 영상 ID로 `i.ytimg.com` 썸네일을 바로 받는다. 배포: `npx supabase functions deploy fetch-og-image --project-ref ddfywsuhaalrapvumfnd --no-verify-jwt --use-api` (CLI 로그인은 사용자가 별도 터미널에서 `npx.cmd supabase login`).
- 제목 카드: `utils/titleCard.js`가 캔버스로 1600×1000 png를 만든다. 색은 `tokens.css`의 `--cover-1..3-*`, 제목 해시로 고른다.
- 수정 시 기존 썸네일 삭제가 실패하면 콘솔 기록 후 진행.
- 필드 검증(길이, URL 형식)은 앱과 DB check 제약 양쪽에 둔다.
- 날짜는 Postgres `date` 타입. 앱에서는 `'YYYY-MM-DD'` 문자열로 다루고 `YYYY.MM.DD`로 표시한다.
- 첫 페이지는 brittanychiang.com 구성을 참고한 소개 + 섹션 페이지 (2026-10-09 사용자 결정, 문서의 카드 목록 + 카테고리 필터 + 무한 스크롤 대체). 넓은 화면(1024px 이상)은 왼쪽에 이름, 한 줄 소개, 목차를 고정하고 오른쪽에 소개(철학), 경력, 작업물(검색창 + 카테고리별 섹션)을 둔다. 좁은 화면은 위아래로 쌓고 목차가 위에 붙는 가로 버튼 줄이 된다.
- 목차(`SectionNav`)는 눌러서 이동하고, 스크롤하면 `useScrollSpy`가 지금 보는 섹션을 강조한다(화면 위 25% 기준선). 카테고리 섹션은 6건씩 보여주고 "더 보기"로 늘린다. 검색 중에는 일치하는 작업물이 있는 카테고리만 남긴다.
- 소개, 경력 글은 `src/content/profile.js`에 적는다 (DB 아님, 고치면 다시 배포).
- 검색어와 지금 보는 섹션은 URL 쿼리(`?q=&section=`)에 담아 상세에서 돌아와도 유지한다.
- Pretendard는 npm 패키지로 설치한다.
- 테스트: `utils/`의 검증 함수만 Vitest 단위 테스트.

## 명령
- `npm run dev` 개발 서버 (localhost:5173)
- `npm run build` 빌드
