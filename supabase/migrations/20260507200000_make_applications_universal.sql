-- Allow all users to apply for jobs by linking applications to profiles instead of provider_profiles
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_provider_id_fkey;

-- Rename column to be more generic if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='provider_id') THEN
    ALTER TABLE public.applications RENAME COLUMN provider_id TO applicant_id;
  END IF;
END $$;

-- IMPORTANT: Convert existing provider_profile IDs to user IDs (profile IDs)
-- This ensures the new foreign key constraint doesn't fail
UPDATE public.applications a
SET applicant_id = p.user_id
FROM public.provider_profiles p
WHERE a.applicant_id = p.id;

-- Update foreign key to profiles
ALTER TABLE public.applications ADD CONSTRAINT applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies for applications
DROP POLICY IF EXISTS "Applications readable by parties" ON public.applications;
DROP POLICY IF EXISTS "Providers can apply" ON public.applications;
DROP POLICY IF EXISTS "Providers update own applications" ON public.applications;

CREATE POLICY "Applications readable by parties" ON public.applications FOR SELECT USING (
  applicant_id = auth.uid()
  OR job_id IN (SELECT id FROM public.jobs WHERE hirer_id = auth.uid())
);

CREATE POLICY "Anyone can apply" ON public.applications FOR INSERT WITH CHECK (
  applicant_id = auth.uid()
);

CREATE POLICY "Applicants update own applications" ON public.applications FOR UPDATE USING (
  applicant_id = auth.uid()
);
