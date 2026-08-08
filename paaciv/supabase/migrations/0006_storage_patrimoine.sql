-- Phase 2 · Bucket de médias patrimoine (lecture publique, écriture admin).
insert into storage.buckets (id, name, public)
values ('patrimoine', 'patrimoine', true)
on conflict (id) do nothing;

create policy "media patrimoine lecture publique"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'patrimoine');

create policy "media patrimoine insertion admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'patrimoine');

create policy "media patrimoine maj admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'patrimoine') with check (bucket_id = 'patrimoine');

create policy "media patrimoine suppression admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'patrimoine');
