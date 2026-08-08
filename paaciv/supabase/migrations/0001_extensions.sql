-- Phase 1 · Extensions
-- PostGIS : types et fonctions géospatiales (utilisés dès la phase 2 pour la
-- géolocalisation du patrimoine). Installé dans le schéma `extensions` selon la
-- convention Supabase (garde le schéma `public` propre ; `extensions` est déjà
-- dans le search_path par défaut).
create extension if not exists postgis with schema extensions;
