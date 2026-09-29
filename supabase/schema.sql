-- Apply only to a dedicated WebSteps Supabase project.
create table if not exists public.learning_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.learning_state enable row level security;
grant select, insert, update, delete on public.learning_state to authenticated;
create policy "Learners can read their own state" on public.learning_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners can create their own state" on public.learning_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Learners can update their own state" on public.learning_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Learners can delete their own state" on public.learning_state for delete to authenticated using ((select auth.uid()) = user_id);
