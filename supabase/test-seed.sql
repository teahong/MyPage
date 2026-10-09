-- 4단계 확인용 테스트 작업물 1건. schema.sql 실행 후 SQL Editor에서 Run 한다.
-- SQL Editor는 관리자 권한으로 실행되므로 RLS와 상관없이 들어간다.
insert into public.works (title, description, category, link_url, thumbnail_url, thumbnail_path, date)
values (
  '테스트 작업물',
  '목록에 카드가 나오는지 확인하는 테스트 데이터예요.',
  '소프트웨어',
  'https://example.com',
  'https://picsum.photos/seed/archive-test/1600/1000',
  '',
  current_date
);

-- 확인이 끝나면 지운다:
-- delete from public.works where title = '테스트 작업물';
