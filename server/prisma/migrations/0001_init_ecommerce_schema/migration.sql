-- Dr. Ortho King initial schema
-- Prisma + Express is the only application API. RLS is on; no anon/authenticated policies.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.order_status as enum ('pending', 'processing', 'dispatched', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('pending', 'completed', 'failed', 'cancelled', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discount_type as enum ('percent', 'amount');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_type as enum ('image', 'video');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null default 'Administrator',
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories (id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  size text not null,
  thickness text not null,
  color text not null,
  regular_price_ugx int not null check (regular_price_ugx >= 0),
  former_price_ugx int check (former_price_ugx is null or former_price_ugx > 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, thickness, color)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  mime_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  name text,
  discount_type public.discount_type not null,
  percent int check (percent is null or (percent >= 1 and percent <= 99)),
  amount_ugx int check (amount_ugx is null or amount_ugx > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (discount_type = 'percent' and percent is not null and amount_ugx is null)
    or
    (discount_type = 'amount' and amount_ugx is not null and percent is null)
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text not null,
  delivery_address text not null,
  notes text,
  currency text not null default 'UGX',
  subtotal_ugx int not null check (subtotal_ugx >= 0),
  discount_ugx int not null default 0 check (discount_ugx >= 0),
  shipping_ugx int not null default 0 check (shipping_ugx >= 0),
  total_ugx int not null check (total_ugx >= 0),
  order_status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  product_name text not null,
  size text not null,
  thickness text not null,
  color text not null,
  quantity int not null check (quantity > 0),
  regular_price_ugx int not null check (regular_price_ugx >= 0),
  discount_ugx int not null default 0 check (discount_ugx >= 0),
  unit_price_ugx int not null check (unit_price_ugx >= 0),
  line_total_ugx int not null check (line_total_ugx >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete restrict,
  payment_status public.payment_status not null default 'pending',
  provider text not null default 'pesapal',
  provider_reference text,
  tracking_id text,
  merchant_reference text,
  raw_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories (id) on delete set null,
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  featured_image_url text,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.gallery_categories (id) on delete set null,
  media_type public.media_type not null,
  storage_path text not null,
  public_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_category_active_featured_idx
  on public.products (category_id, is_active, is_featured);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists promotions_lookup_idx
  on public.promotions (product_id, is_active, starts_at, ends_at);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (order_status);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists blog_categories_set_updated_at on public.blog_categories;
create trigger blog_categories_set_updated_at before update on public.blog_categories
for each row execute function public.set_updated_at();

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists gallery_categories_set_updated_at on public.gallery_categories;
create trigger gallery_categories_set_updated_at before update on public.gallery_categories
for each row execute function public.set_updated_at();

drop trigger if exists gallery_items_set_updated_at on public.gallery_items;
create trigger gallery_items_set_updated_at before update on public.gallery_items
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]),
  ('blog-images', 'blog-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]),
  ('gallery', 'gallery', true, 104857600, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']::text[])
on conflict (id) do nothing;

drop policy if exists "Public read media buckets" on storage.objects;
create policy "Public read media buckets"
on storage.objects
for select
to public
using (bucket_id in ('product-images', 'blog-images', 'gallery'));
