-- Phase 2 · Politiques RLS patrimoine + images.
-- (RLS déjà activé sur les deux tables en Task 1 → migration 0004.)

-- Durcissement : épingle le search_path de touch_updated_at() (oubli en 0004 ;
-- lève l'avertissement Supabase function_search_path_mutable, aligne sur
-- patrimoine_sync_geom qui l'épingle déjà). now() est en pg_catalog (toujours
-- résolu), donc search_path='' suffit.
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Patrimoine : lecture publique des publiés ; accès complet aux authentifiés (admin unique).
create policy "patrimoine select public"
  on patrimoine for select to anon using (statut = 'publie');
create policy "patrimoine all admin"
  on patrimoine for all to authenticated using (true) with check (true);

-- Images : lisibles par le public si le patrimoine parent est publié ; accès complet admin.
create policy "images select public"
  on images for select to anon
  using ((select exists (
    select 1 from patrimoine p
    where p.id = images.patrimoine_id and p.statut = 'publie'
  )));
create policy "images all admin"
  on images for all to authenticated using (true) with check (true);
