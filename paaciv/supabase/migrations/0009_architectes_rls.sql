-- Phase 3 · Politiques RLS architectes + liaison.

-- Architectes : lecture publique des publiés ; accès complet admin.
create policy "architectes select public"
  on architectes for select to anon using (statut = 'publie');
create policy "architectes all admin"
  on architectes for all to authenticated using (true) with check (true);

-- Liaison : lisible par le public seulement si l'architecte ET le patrimoine sont publiés.
create policy "patarch select public"
  on patrimoine_architecte for select to anon
  using (
    (select exists (select 1 from architectes a where a.id = patrimoine_architecte.architecte_id and a.statut = 'publie'))
    and
    (select exists (select 1 from patrimoine p where p.id = patrimoine_architecte.patrimoine_id and p.statut = 'publie'))
  );
create policy "patarch all admin"
  on patrimoine_architecte for all to authenticated using (true) with check (true);
