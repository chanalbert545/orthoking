alter table public.product_variants
add column if not exists former_price_ugx int
check (former_price_ugx is null or former_price_ugx > 0);