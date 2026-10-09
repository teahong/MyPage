-- 작업물 아카이브 스키마
-- Supabase 대시보드 > SQL Editor에 전체를 붙여넣고 Run 한다.
-- 여러 번 실행해도 안전하도록 작성했다.
--
-- 처음 실행할 때만: 아래 app_settings의 '관리자이메일@gmail.com'을 실제 관리자 이메일로 바꾼다 (1곳).
-- 이미 저장된 관리자 이메일은 다시 실행해도 덮어쓰지 않는다.
-- 관리자 이메일을 바꾸려면 이 줄만 따로 실행한다:
--   update public.app_settings set value = '새이메일' where key = 'admin_email';

-- ─────────────────────────────────────────────
-- 설정 (관리자 이메일)
-- 누구도 직접 읽거나 쓸 수 없다. is_admin()만 읽는다.
-- ─────────────────────────────────────────────
create table if not exists public.app_settings (
  key    text primary key,
  value  text not null
);

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;

insert into public.app_settings (key, value) values
  ('admin_email', '관리자이메일@gmail.com')
on conflict (key) do nothing;

-- ─────────────────────────────────────────────
-- 관리자 판별
-- 읽기는 누구나, 쓰기는 이 함수가 true인 사용자만. (문서 4.3 Security Rules 대체)
-- 관리자는 이메일 + 6자리 PIN(비밀번호)으로 로그인한다.
-- 대시보드에서 직접 만든 관리자 계정이고 이메일이 app_settings와 일치할 때만 true.
-- security definer: 호출자 권한으로는 app_settings를 읽을 수 없어서 함수 소유자 권한으로 읽는다.
-- ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = (
      select lower(value) from public.app_settings where key = 'admin_email'
    )
      and auth.jwt() -> 'app_metadata' ->> 'provider' = 'email',
    false
  );
$$;

-- ─────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────
create table if not exists public.categories (
  name        text primary key
              check (char_length(name) between 1 and 20 and name = btrim(name)),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 대소문자 무시 중복 금지
create unique index if not exists categories_name_lower_key on public.categories (lower(name));

-- 관리자가 정한 보여줄 순서. null이면 아직 정하지 않은 것(새 카테고리)으로 뒤에 온다.
alter table public.categories add column if not exists sort_order integer;

insert into public.categories (name, is_default) values
  ('발표 자료', true),
  ('소프트웨어', true),
  ('출판물', true)
on conflict (name) do nothing;

-- ─────────────────────────────────────────────
-- works
-- ─────────────────────────────────────────────
create table if not exists public.works (
  id              uuid primary key default gen_random_uuid(),
  title           text not null
                  check (char_length(title) between 1 and 60 and title = btrim(title)),
  description     text not null
                  check (char_length(description) between 1 and 2000),
  category        text not null
                  references public.categories (name) on update cascade,
  link_url        text not null
                  check (link_url ~* '^https?://[^\s]+$'),
  thumbnail_url   text not null,
  thumbnail_path  text not null,
  date            date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 관리자가 카테고리 안에서 정한 보여줄 순서. null이면 아직 정하지 않은 것(새 작업물)으로 맨 앞에 온다.
alter table public.works add column if not exists sort_order integer;

drop index if exists public.works_date_created_at_idx;
create index if not exists works_order_idx
  on public.works (sort_order asc nulls first, date desc, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 접근 권한 (Row Level Security)
-- ─────────────────────────────────────────────
grant select on public.works, public.categories to anon, authenticated;
grant insert, update, delete on public.works, public.categories to authenticated;

alter table public.works enable row level security;
alter table public.categories enable row level security;

drop policy if exists "works read" on public.works;
drop policy if exists "works admin write" on public.works;
create policy "works read" on public.works
  for select to anon, authenticated using (true);
create policy "works admin write" on public.works
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 작업물 삭제는 최근 5분 안에 PIN(비밀번호)으로 인증한 경우에만 허용한다.
-- 로그인 토큰의 amr(인증 방법과 시각)을 본다. 앱은 삭제 직전에 PIN과 로봇 확인으로 다시 로그인한다.
-- restrictive 정책이라 위의 "works admin write"와 AND로 묶인다.
create or replace function public.has_recent_pin_auth()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
    where m ->> 'method' = 'password'
      and to_timestamp((m ->> 'timestamp')::double precision) > now() - interval '5 minutes'
  );
$$;

drop policy if exists "works delete needs recent pin" on public.works;
create policy "works delete needs recent pin" on public.works
  as restrictive for delete to authenticated
  using (public.has_recent_pin_auth());

drop policy if exists "categories read" on public.categories;
drop policy if exists "categories admin write" on public.categories;
create policy "categories read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 작업물 순서 저장. 한 카테고리의 작업물 id를 보여줄 순서대로 받아 sort_order를 1, 2, 3...으로 바꾼다.
-- security invoker라 위 RLS가 그대로 적용된다(관리자가 아니면 0건). 바뀐 행 수를 돌려준다.
create or replace function public.set_work_order(ordered_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $
declare
  changed integer;
begin
  update public.works as w
     set sort_order = o.ord
    from unnest(ordered_ids) with ordinality as o(id, ord)
   where w.id = o.id;
  get diagnostics changed = row_count;
  return changed;
end;
$;

revoke execute on function public.set_work_order(uuid[]) from public, anon;
grant execute on function public.set_work_order(uuid[]) to authenticated;

-- 카테고리 순서 저장. 이름을 보여줄 순서대로 받아 sort_order를 1, 2, 3...으로 바꾼다.
-- security invoker라 RLS가 그대로 적용된다(관리자가 아니면 0건). 바뀐 행 수를 돌려준다.
create or replace function public.set_category_order(ordered_names text[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $
declare
  changed integer;
begin
  update public.categories as c
     set sort_order = o.ord
    from unnest(ordered_names) with ordinality as o(name, ord)
   where c.name = o.name;
  get diagnostics changed = row_count;
  return changed;
end;
$;

revoke execute on function public.set_category_order(text[]) from public, anon;
grant execute on function public.set_category_order(text[]) to authenticated;

-- ─────────────────────────────────────────────
-- 썸네일 Storage
-- 공개 버킷이라 읽기(공개 URL)는 정책 없이 된다. 5MB, jpg/png/webp만.
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "thumbnails admin select" on storage.objects;
drop policy if exists "thumbnails admin insert" on storage.objects;
drop policy if exists "thumbnails admin update" on storage.objects;
drop policy if exists "thumbnails admin delete" on storage.objects;
-- 파일 삭제 API는 select 권한도 필요하다.
create policy "thumbnails admin select" on storage.objects
  for select to authenticated using (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin update" on storage.objects
  for update to authenticated using (bucket_id = 'thumbnails' and public.is_admin());
create policy "thumbnails admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'thumbnails' and public.is_admin());
