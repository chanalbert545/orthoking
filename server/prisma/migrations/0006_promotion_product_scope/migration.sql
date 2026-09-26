alter table public.promotions
  add column if not exists product_ids uuid[] not null default '{}',
  add column if not exists all_products boolean not null default false;

update public.promotions
set product_ids = array[product_id]
where cardinality(product_ids) = 0;