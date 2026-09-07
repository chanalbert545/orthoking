alter table public.blog_posts
add column if not exists media_type public.media_type not null default 'image',
add column if not exists cta_text text,
add column if not exists cta_url text;
