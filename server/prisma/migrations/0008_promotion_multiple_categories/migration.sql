alter table public.promotions
  add column if not exists category_ids uuid[] not null default '{}';

update public.promotions
set category_ids = array[category_id]
where category_id is not null
  and cardinality(category_ids) = 0;