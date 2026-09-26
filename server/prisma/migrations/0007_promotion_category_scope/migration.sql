alter table public.promotions
  add column if not exists category_id uuid,
  alter column product_id drop not null;

alter table public.promotions
  add constraint promotions_category_id_fkey
  foreign key (category_id) references public.categories(id)
  on delete cascade on update no action;

create index if not exists promotions_category_lookup_idx
  on public.promotions (category_id, is_active, starts_at, ends_at);