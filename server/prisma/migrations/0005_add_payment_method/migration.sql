alter table public.payments
  add column if not exists payment_method text not null default 'pesapal';

create index if not exists payments_method_status_idx
  on public.payments (payment_method, payment_status);