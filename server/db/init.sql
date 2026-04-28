create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on users (email);

-- Catalogs
create table if not exists skin_types (
  id text primary key,
  label text not null
);

create table if not exists symptoms (
  id text primary key,
  label text not null,
  tone text not null
);

create table if not exists products_catalog (
  id text primary key,
  name text not null,
  schedule text not null,
  icon text not null,
  tone text not null,
  category text not null,
  actives text[] not null default '{}'::text[],
  barrier_support boolean not null default false
);

create table if not exists recovery_days (
  day text primary key,
  level int not null,
  state text not null,
  is_current boolean not null default false
);

-- User history
create table if not exists analysis_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  risk_score int not null,
  risk_label text not null,
  summary text not null,
  recommendation text not null,
  inputs jsonb not null,
  keep jsonb not null,
  pause jsonb not null
);

create index if not exists analysis_runs_user_id_created_at_idx on analysis_runs (user_id, created_at desc);

-- Seed data (idempotent)
insert into skin_types (id, label) values
  ('dry', 'Сухая'),
  ('oily', 'Жирная'),
  ('combo', 'Комби'),
  ('sensitive', 'Чувствительная')
on conflict (id) do update set label = excluded.label;

insert into symptoms (id, label, tone) values
  ('redness', 'Покраснение', 'rose'),
  ('acne', 'Акне', 'neutral'),
  ('dryness', 'Сухость', 'amber'),
  ('flaking', 'Шелушение', 'neutral'),
  ('tightness', 'Стянутость', 'blue')
on conflict (id) do update set label = excluded.label, tone = excluded.tone;

insert into products_catalog (id, name, schedule, icon, tone, category, actives, barrier_support) values
  ('cleanser_gentle', 'Мягкое очищение', 'Ежедневно, Утро/Вечер', 'drop', 'blue', 'cleanser', '{}'::text[], true),
  ('moisturizer_ceramides', 'Базовый крем с керамидами', 'Ежедневно, После очищения', 'spark', 'emerald', 'moisturizer', '{ceramides}'::text[], true),
  ('sunscreen_spf50', 'SPF 50 без отдушек', 'Ежедневно, Утро', 'spark', 'blue', 'sunscreen', '{spf}'::text[], true),
  ('exfoliant_bha2', 'Сыворотка BHA 2%', '2–3 раза в неделю, Вечер', 'tube', 'rose', 'exfoliant', '{bha}'::text[], false),
  ('treatment_niacinamide5', 'Ниацинамид 5%', 'Ежедневно, Вечер', 'spark', 'blue', 'treatment', '{niacinamide}'::text[], true),
  ('toner_soothing', 'Успокаивающий тонер', 'По необходимости, 1 раз в день', 'spark', 'blue', 'toner', '{}'::text[], true),
  ('balm_barrier', 'Восстанавливающий бальзам', 'По необходимости, Вечер', 'spark', 'emerald', 'moisturizer', '{occlusive}'::text[], true),
  ('treatment_retinoid', 'Ретиноид', '1–2 раза в неделю, Вечер', 'tube', 'amber', 'treatment', '{retinoid}'::text[], false)
on conflict (id) do update set
  name = excluded.name,
  schedule = excluded.schedule,
  icon = excluded.icon,
  tone = excluded.tone,
  category = excluded.category,
  actives = excluded.actives,
  barrier_support = excluded.barrier_support;

insert into recovery_days (day, level, state, is_current) values
  ('Пн', 30, 'rose', false),
  ('Вт', 40, 'rose', false),
  ('Ср', 60, 'amber', false),
  ('Чт', 75, 'emerald', true),
  ('Пт', 20, 'future', false),
  ('Сб', 20, 'future', false),
  ('Вс', 20, 'future', false)
on conflict (day) do update set
  level = excluded.level,
  state = excluded.state,
  is_current = excluded.is_current;
