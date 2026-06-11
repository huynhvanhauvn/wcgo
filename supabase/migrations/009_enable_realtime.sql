-- Enable Realtime for key tables to ensure the UI updates instantly
begin;
  -- Remove if exists to avoid errors
  drop publication if exists supabase_realtime;

  -- Create publication for all tables we want to track
  create publication supabase_realtime for table
    public.matches,
    public.user_totals,
    public.comments,
    public.predictions,
    public.profiles;
commit;
