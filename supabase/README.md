# Supabase

The database schema will live here as versioned SQL migrations, applied with the
Supabase CLI (`supabase db push`) or pasted into the dashboard SQL editor.
No migrations exist yet.

Conventions, to be confirmed when the first table is designed:

- One file per change in `migrations/`, named `YYYYMMDDHHMMSS_short_description.sql`.
- Every table gets Row Level Security enabled in the same migration that creates it.
- The desktop app only ever uses the publishable key. Anything that needs elevated
  rights belongs in a database function or an Edge Function, never in the client.
