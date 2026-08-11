-- Phase 4 · Politiques RLS du volet éditorial.

-- Table de référence : lecture publique inconditionnelle.
create policy "categories_article select public"
  on categories_article for select to anon using (true);
create policy "categories_article all admin"
  on categories_article for all to authenticated using (true) with check (true);

create policy "articles select public"
  on articles for select to anon using (statut = 'publie');
create policy "articles all admin"
  on articles for all to authenticated using (true) with check (true);

create policy "reportages select public"
  on reportages for select to anon using (statut = 'publie');
create policy "reportages all admin"
  on reportages for all to authenticated using (true) with check (true);

create policy "evenements select public"
  on evenements for select to anon using (statut = 'publie');
create policy "evenements all admin"
  on evenements for all to authenticated using (true) with check (true);
