-- Remove the public blog and its email subscription list.
-- These tables were created outside the repository's migration history,
-- so IF EXISTS keeps this safe on environments that never had them.

drop table if exists public.blog_subscribers;
drop table if exists public.blog_posts;
