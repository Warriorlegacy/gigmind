-- Fix provider_profiles RLS policies to be more explicit for upsert
DROP POLICY IF EXISTS "Providers can manage own profile" ON public.provider_profiles;

CREATE POLICY "Providers can insert own profile" ON public.provider_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile" ON public.provider_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

-- Also ensure provider_categories has explicit policies
DROP POLICY IF EXISTS "Provider categories manageable" ON public.provider_categories;

CREATE POLICY "Providers can manage own categories" ON public.provider_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM provider_profiles 
      WHERE id = provider_id AND user_id = auth.uid()
    )
  );
