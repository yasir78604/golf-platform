-- Golf SaaS workflow migration
-- Run in Supabase SQL editor before using the full subscription/draw/charity workflow.

alter table public.users
  add column if not exists country text,
  add column if not exists charity_id uuid references public.charities(id) on delete set null,
  add column if not exists charity_percentage numeric default 10 check (charity_percentage >= 10 and charity_percentage <= 100);

alter table public.subscriptions
  add column if not exists stripe_session_id text unique,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists start_date timestamptz,
  add column if not exists end_date timestamptz,
  add column if not exists cancel_at_period_end boolean default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scores_user_date_unique'
  ) then
    alter table public.scores add constraint scores_user_date_unique unique (user_id, date);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'scores_value_range'
  ) then
    alter table public.scores add constraint scores_value_range check (score between 1 and 45);
  end if;
end $$;

alter table public.draws
  add column if not exists executed_at timestamptz,
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'draws_month_year_unique'
  ) then
    alter table public.draws add constraint draws_month_year_unique unique (month, year);
  end if;
end $$;

alter table public.prize_pools
  add column if not exists charity_amount numeric default 0,
  add column if not exists jackpot_rollover numeric default 0;

alter table public.draw_results
  add column if not exists proof_url text,
  add column if not exists proof_uploaded_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists payout_status text default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'draw_results_status_check'
  ) then
    alter table public.draw_results
      add constraint draw_results_status_check
      check (status in ('pending', 'proof_submitted', 'verified', 'rejected', 'paid'));
  end if;
end $$;

alter table public.charities
  add column if not exists category text,
  add column if not exists image_url text,
  add column if not exists website_url text,
  add column if not exists events_url text,
  add column if not exists featured boolean default false;

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  charity_id uuid references public.charities(id) on delete cascade,
  amount numeric not null check (amount >= 1),
  stripe_session_id text unique,
  status text default 'pending',
  created_at timestamptz default now()
);

create index if not exists idx_scores_user_date on public.scores(user_id, date desc);
create index if not exists idx_draw_results_user on public.draw_results(user_id, created_at desc);
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status);
create index if not exists idx_charities_featured_category on public.charities(featured, category);

insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', true)
on conflict (id) do nothing;
