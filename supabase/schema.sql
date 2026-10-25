-- Rui Finance: jalankan seluruh isi file ini di Supabase > SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  initial_balance bigint not null default 0,
  purpose text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('operasional','pribadi')),
  sort int not null default 0
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('income','expense','transfer')),
  source text,                                   -- 'narik' untuk pendapatan ShopeeFood
  amount bigint not null check (amount > 0),
  account_id uuid not null references accounts(id) on delete restrict,
  to_account_id uuid references accounts(id) on delete restrict,
  category_id uuid references categories(id) on delete restrict,
  note text,
  base_income bigint,                            -- khusus narik: pendapatan ShopeeFood
  bonus bigint,
  tips bigint,
  orders int,
  created_at timestamptz not null default now(),
  check (type <> 'transfer' or (to_account_id is not null and to_account_id <> account_id))
);
create index if not exists tx_user_date on transactions (user_id, date);

-- Alokasi virtual (bukan saldo rekening). tx_id kosong = penyesuaian manual.
create table if not exists allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tx_id uuid references transactions(id) on delete cascade,
  date date not null,
  pos text not null check (pos in ('harian','tabungan','motor','jajan','darurat')),
  amount bigint not null check (amount <> 0),
  note text
);
create index if not exists alloc_user_date on allocations (user_id, date);

create table if not exists settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  vehicle text not null default 'Honda PCX 160',
  daily_km numeric not null default 80,
  km_per_liter numeric not null default 40,
  fuel_price int not null default 15950,
  work_days jsonb not null default '[1,2,3,4,5,6]',
  alloc_pct jsonb not null default '{"harian":45,"tabungan":20,"motor":15,"jajan":10,"darurat":10}',
  targets jsonb not null default '{"tabungan":1000000,"darurat":0,"motor":0}'
);

-- Row Level Security: tiap pengguna hanya bisa mengakses datanya sendiri.
do $$
declare t text;
begin
  foreach t in array array['accounts','categories','transactions','allocations','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own data" on %I', t);
    execute format('create policy "own data" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
