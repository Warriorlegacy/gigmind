-- Production hardening fixes for job posting, applications, notifications, trust scores, and matching.

DROP POLICY IF EXISTS "Hirers can insert jobs" ON public.jobs;
CREATE POLICY "Hirers can insert jobs" ON public.jobs
  FOR INSERT WITH CHECK (hirer_id = auth.uid());

DROP POLICY IF EXISTS "Hirer updates applications" ON public.applications;
DROP POLICY IF EXISTS "Hirer updates applications on own jobs" ON public.applications;
CREATE POLICY "Hirer updates applications on own jobs"
  ON public.applications FOR UPDATE
  USING (job_id IN (SELECT id FROM public.jobs WHERE hirer_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS response_rate NUMERIC DEFAULT 0;
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS completion_rate NUMERIC DEFAULT 0;

CREATE OR REPLACE VIEW public.provider_trust_scores AS
SELECT
  pp.id,
  LEAST(100,
    COALESCE(pp.total_jobs_done * 2, 0) +
    COALESCE(pp.avg_rating * 6, 0) +
    CASE WHEN p.is_verified THEN 20 ELSE 0 END +
    CASE WHEN COALESCE(pp.response_rate, 0) > 0.8 THEN 10 ELSE COALESCE(pp.response_rate * 10, 0) END +
    CASE WHEN COALESCE(pp.completion_rate, 0) > 0.9 THEN 10 ELSE COALESCE(pp.completion_rate * 10, 0) END
  ) AS trust_score
FROM public.provider_profiles pp
JOIN public.profiles p ON p.id = pp.user_id;

CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    j.hirer_id,
    'new_application',
    'New Application Received',
    'Someone applied to: ' || j.title,
    jsonb_build_object('job_id', NEW.job_id, 'application_id', NEW.id)
  FROM public.jobs j
  WHERE j.id = NEW.job_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_insert ON public.applications;
CREATE TRIGGER on_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();
