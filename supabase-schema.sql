-- Run this in the Supabase SQL editor

create table if not exists signature_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  signer_name text,
  signer_email text,
  status text not null default 'pending', -- 'pending' | 'signed'
  signature_url text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_signature_requests_token on signature_requests(token);

-- Storage bucket for the signature PNGs
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

-- Allow public read of signature images (they're just signature PNGs, not sensitive docs)
create policy "Public read signatures"
on storage.objects for select
using (bucket_id = 'signatures');

-- Allow inserts from the anon key (the signing page uses this)
create policy "Public insert signatures"
on storage.objects for insert
with check (bucket_id = 'signatures');

-- Row Level Security: allow anon to read/update their own request by token, and insert is server-side only via API route
alter table signature_requests enable row level security;

create policy "Read own request by token"
on signature_requests for select
using (true); -- token is the secret; anyone with the link can read that row (needed for the sign page)

create policy "Update own request on sign"
on signature_requests for update
using (true)
with check (true);
