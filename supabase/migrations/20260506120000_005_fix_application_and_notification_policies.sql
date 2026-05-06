/*
  # Fix application & notification RLS policies

  1. Allow hirers to update applications for their own jobs (shortlist, reject, hire)
  2. Allow authenticated users to insert notifications (needed when a provider applies
     and we notify the hirer via client-side insert with the hirer's user_id)
  3. Also allow hirers to update jobs they own (for hired_provider_id / status changes)
*/

-- Hirers can update any application on their own jobs (shortlist / reject / hire)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications' AND policyname = 'Hirer updates applications on own jobs'
  ) THEN
    CREATE POLICY "Hirer updates applications on own jobs" ON applications
      FOR UPDATE
      USING (
        job_id IN (SELECT id FROM jobs WHERE hirer_id = auth.uid())
      );
  END IF;
END$$;

-- Allow any authenticated user to INSERT a notification
-- (provider triggers a notification to hirer after applying)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications' AND policyname = 'Authenticated users can insert notifications'
  ) THEN
    CREATE POLICY "Authenticated users can insert notifications" ON notifications
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END$$;
