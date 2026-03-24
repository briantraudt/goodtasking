create table if not exists public.vibe_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  raw_idea text not null,
  distilled_summary text,
  gtm_strategy text,
  launch_needs text,
  launch_checklist jsonb not null default '[]'::jsonb,
  suggested_tech_stack text[] not null default '{}'::text[],
  status text not null default 'draft',
  project_id uuid references public.vibe_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vibe_ideas_user_id_idx on public.vibe_ideas(user_id);
create index if not exists vibe_ideas_status_idx on public.vibe_ideas(status);

alter table public.vibe_ideas enable row level security;

create policy "Users can view their own ideas"
on public.vibe_ideas
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own ideas"
on public.vibe_ideas
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own ideas"
on public.vibe_ideas
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own ideas"
on public.vibe_ideas
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_vibe_ideas_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vibe_ideas_set_updated_at on public.vibe_ideas;

create trigger vibe_ideas_set_updated_at
before update on public.vibe_ideas
for each row
execute function public.set_vibe_ideas_updated_at();
