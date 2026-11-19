create table if not exists public.shared_trip_state (
  id text primary key,
  state jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_trip_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.shared_trip_members enable row level security;
revoke all on public.shared_trip_members from anon, authenticated, public;

create or replace function public.has_shared_trip_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
      from public.shared_trip_members
     where user_id = (select auth.uid())
  );
$function$;

revoke all on function public.has_shared_trip_access() from public, anon;
grant execute on function public.has_shared_trip_access() to authenticated;

alter table public.shared_trip_state enable row level security;
revoke all on public.shared_trip_state from anon, public;
grant select, insert, update on public.shared_trip_state to authenticated;

drop policy if exists "Signed-in users can read shared trip" on public.shared_trip_state;
create policy "Signed-in users can read shared trip"
  on public.shared_trip_state
  for select
  to authenticated
  using ((select public.has_shared_trip_access()));

drop policy if exists "Signed-in users can create shared trip" on public.shared_trip_state;
create policy "Signed-in users can create shared trip"
  on public.shared_trip_state
  for insert
  to authenticated
  with check ((select public.has_shared_trip_access()));

drop policy if exists "Signed-in users can update shared trip" on public.shared_trip_state;
create policy "Signed-in users can update shared trip"
  on public.shared_trip_state
  for update
  to authenticated
  using ((select public.has_shared_trip_access()))
  with check ((select public.has_shared_trip_access()));

create or replace function public.save_shared_trip_state(
  p_id text,
  p_state jsonb,
  p_expected_version bigint
)
returns table(saved boolean, version bigint, state jsonb)
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  current_row public.shared_trip_state%rowtype;
begin
  if not public.has_shared_trip_access() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select *
    into current_row
    from public.shared_trip_state
   where id = p_id
   for update;

  if not found then
    if p_expected_version <> 0 then
      return query select false, 0::bigint, null::jsonb;
      return;
    end if;

    insert into public.shared_trip_state (id, state, version, updated_at)
    values (p_id, p_state, 1, now())
    on conflict (id) do nothing;

    if found then
      return query select true, 1::bigint, p_state;
      return;
    end if;

    select *
      into current_row
      from public.shared_trip_state
     where id = p_id
     for update;
  end if;

  if current_row.version <> p_expected_version then
    return query select false, current_row.version, current_row.state;
    return;
  end if;

  update public.shared_trip_state
     set state = p_state,
         version = current_row.version + 1,
         updated_at = now()
   where id = p_id
   returning * into current_row;

  return query select true, current_row.version, current_row.state;
end;
$function$;

revoke all on function public.save_shared_trip_state(text, jsonb, bigint) from public, anon;
grant execute on function public.save_shared_trip_state(text, jsonb, bigint) to authenticated;

do $publication$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'shared_trip_state'
  ) then
    alter publication supabase_realtime add table public.shared_trip_state;
  end if;
end;
$publication$;
