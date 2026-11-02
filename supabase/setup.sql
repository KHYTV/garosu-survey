-- =====================================================================
-- 「우리동네가로수」 사용성 평가 설문 — Supabase 설정 스크립트
-- 사용법: Supabase 대시보드 → SQL Editor → 이 파일 전체 붙여넣기
--         → 맨 아래 "관리자 비밀번호" 줄을 본인 비밀번호로 바꾼 뒤 Run.
-- 여러 번 실행해도 안전합니다(비밀번호를 바꿀 때도 다시 실행).
-- 우리동네가로수 앱(sns_schema.sql)과 같은 프로젝트에 넣어도 됩니다(표 이름 gs_).
--
-- 보안 구조
--  * 모든 표는 RLS 를 켜고 정책을 두지 않음 → 웹(publishable 키)에서 표를 직접 읽거나 쓸 수 없음
--  * 웹은 아래 gs_* 함수로만 접근
--  * 이름·학번은 받지 않고, 기기가 만든 익명 토큰(pid)으로 시작 문항(pre)과 본 설문(post)을 잇는다
-- =====================================================================

create table if not exists public.gs_sessions (
  code       text primary key check (code ~ '^[A-Z0-9]{3,12}$'),
  title      text not null default '',
  status     text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at  timestamptz
);

create table if not exists public.gs_responses (
  id           uuid primary key default gen_random_uuid(),
  session_code text not null references public.gs_sessions(code) on delete cascade,
  pid          text not null check (pid ~ '^[A-Z0-9]{6,12}$'),
  stage        text not null check (stage in ('pre', 'post')),
  answers      jsonb not null,
  created_at   timestamptz not null default now(),
  unique (session_code, pid, stage)
);
create index if not exists gs_responses_session_idx on public.gs_responses (session_code);

create table if not exists public.gs_admin (
  id       int primary key default 1 check (id = 1),
  key_hash text not null
);

alter table public.gs_sessions  enable row level security;
alter table public.gs_responses enable row level security;
alter table public.gs_admin     enable row level security;
revoke all on table public.gs_sessions, public.gs_responses, public.gs_admin from public, anon, authenticated;

-- 내부: 관리자 비밀번호 확인
create or replace function public.gs_check_admin(p_admin_key text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_admin_key is null or p_admin_key = '' or p_admin_key = '여기에-비밀번호' then
    raise exception 'ADMIN_KEY_INVALID';
  end if;
  if not exists (select 1 from gs_admin where key_hash = encode(sha256(convert_to(p_admin_key, 'UTF8')), 'hex')) then
    raise exception 'ADMIN_KEY_INVALID';
  end if;
end;
$$;

-- 공개: 세션 상태
create or replace function public.gs_session_info(p_code text)
returns json
language sql security definer set search_path = public stable
as $$
  select json_build_object(
    'code', s.code, 'title', s.title, 'status', s.status,
    'n', (select count(*) from gs_responses r where r.session_code = s.code and r.stage = 'post'),
    'n_pre', (select count(*) from gs_responses r where r.session_code = s.code and r.stage = 'pre')
  )
  from gs_sessions s
  where s.code = upper(trim(p_code));
$$;

-- 공개: 제출. pre(시작 문항)는 같은 참여자가 다시 보내면 덮어쓰고, post(본 설문)는 1회만
create or replace function public.gs_submit(p_code text, p_pid text, p_stage text, p_answers jsonb)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_code   text := upper(trim(coalesce(p_code, '')));
  v_pid    text := upper(trim(coalesce(p_pid, '')));
  v_status text;
begin
  select status into v_status from gs_sessions where code = v_code;
  if v_status is null then raise exception 'SESSION_NOT_FOUND'; end if;
  if v_status <> 'open' then raise exception 'SESSION_CLOSED'; end if;
  if v_pid !~ '^[A-Z0-9]{6,12}$' or p_stage not in ('pre', 'post') then raise exception 'INVALID_INPUT'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 20000 then
    raise exception 'INVALID_INPUT';
  end if;
  if p_stage = 'post' and exists (select 1 from gs_responses where session_code = v_code and pid = v_pid and stage = 'post') then
    raise exception 'ALREADY_SUBMITTED';
  end if;
  insert into gs_responses (session_code, pid, stage, answers)
  values (v_code, v_pid, p_stage, p_answers)
  on conflict (session_code, pid, stage) do update set answers = excluded.answers, created_at = now();
  return json_build_object('ok', true);
end;
$$;

-- 공개(종료 후) / 관리자(언제나): 익명 응답 목록
create or replace function public.gs_results(p_code text, p_admin_key text default null)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  s      gs_sessions%rowtype;
begin
  select * into s from gs_sessions where code = v_code;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if s.status <> 'closed' then perform gs_check_admin(p_admin_key); end if;
  return json_build_object(
    'code', s.code, 'title', s.title, 'status', s.status,
    'rows', coalesce((select json_agg(json_build_object('pid', r.pid, 'stage', r.stage, 'answers', r.answers, 'created_at', r.created_at) order by r.created_at)
                      from gs_responses r where r.session_code = v_code), '[]'::json)
  );
end;
$$;

-- 관리자 전용
create or replace function public.gs_admin_list(p_admin_key text)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  perform gs_check_admin(p_admin_key);
  return coalesce((
    select json_agg(json_build_object(
      'code', s.code, 'title', s.title, 'status', s.status, 'created_at', s.created_at,
      'n', (select count(*) from gs_responses r where r.session_code = s.code and r.stage = 'post'),
      'n_pre', (select count(*) from gs_responses r where r.session_code = s.code and r.stage = 'pre')
    ) order by s.created_at desc)
    from gs_sessions s), '[]'::json);
end;
$$;

create or replace function public.gs_admin_create(p_admin_key text, p_code text, p_title text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  perform gs_check_admin(p_admin_key);
  if v_code !~ '^[A-Z0-9]{3,12}$' then raise exception 'INVALID_INPUT'; end if;
  if exists (select 1 from gs_sessions where code = v_code) then raise exception 'SESSION_EXISTS'; end if;
  insert into gs_sessions (code, title) values (v_code, left(trim(coalesce(p_title, '')), 80));
  return gs_session_info(v_code);
end;
$$;

create or replace function public.gs_admin_set_status(p_admin_key text, p_code text, p_status text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  perform gs_check_admin(p_admin_key);
  if p_status not in ('open', 'closed') then raise exception 'INVALID_INPUT'; end if;
  update gs_sessions set status = p_status, closed_at = case when p_status = 'closed' then now() else null end where code = v_code;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  return gs_session_info(v_code);
end;
$$;

-- 참여 현황(익명 토큰과 제출 시각만)
create or replace function public.gs_admin_roster(p_admin_key text, p_code text)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  perform gs_check_admin(p_admin_key);
  return coalesce((
    select json_agg(json_build_object('pid', t.pid, 'pre_at', t.pre_at, 'post_at', t.post_at) order by coalesce(t.pre_at, t.post_at))
    from (
      select pid,
             max(case when stage = 'pre' then created_at end) as pre_at,
             max(case when stage = 'post' then created_at end) as post_at
      from gs_responses where session_code = upper(trim(p_code)) group by pid
    ) t), '[]'::json);
end;
$$;

create or replace function public.gs_admin_delete(p_admin_key text, p_code text)
returns json
language plpgsql security definer set search_path = public
as $$
begin
  perform gs_check_admin(p_admin_key);
  delete from gs_sessions where code = upper(trim(p_code));
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  return json_build_object('ok', true);
end;
$$;

revoke execute on function public.gs_check_admin(text) from public, anon, authenticated;
grant execute on function
  public.gs_session_info(text),
  public.gs_submit(text, text, text, jsonb),
  public.gs_results(text, text),
  public.gs_admin_list(text),
  public.gs_admin_create(text, text, text),
  public.gs_admin_set_status(text, text, text),
  public.gs_admin_roster(text, text),
  public.gs_admin_delete(text, text)
to anon, authenticated;

-- =====================================================================
-- ▼ 관리자 비밀번호: '여기에-비밀번호' 를 본인만 아는 문구(12자 이상)로 바꾸고 실행
-- =====================================================================
insert into public.gs_admin (id, key_hash)
values (1, encode(sha256(convert_to('여기에-비밀번호', 'UTF8')), 'hex'))
on conflict (id) do update set key_hash = excluded.key_hash;
