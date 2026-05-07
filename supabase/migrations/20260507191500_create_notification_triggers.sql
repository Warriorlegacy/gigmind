-- Function to create notification for new messages
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  sender_name TEXT;
  job_title TEXT;
BEGIN
  -- 1. Find the recipient (the party in the conversation that ISN'T the sender)
  SELECT 
    CASE 
      WHEN NEW.sender_id = c.hirer_id THEN c.provider_id
      ELSE c.hirer_id
    END,
    j.title
  INTO target_user_id, job_title
  FROM public.conversations c
  JOIN public.jobs j ON j.id = c.job_id
  WHERE c.id = NEW.conversation_id;

  -- 2. Get sender name
  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- 3. Insert notification
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    target_user_id,
    'message',
    'New message from ' || COALESCE(sender_name, 'User'),
    NEW.content,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'job_title', job_title,
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_notification();

-- Function to create notification for new applications
CREATE OR REPLACE FUNCTION public.handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  job_hirer_id UUID;
  job_title TEXT;
  provider_name TEXT;
BEGIN
  -- 1. Get job details
  SELECT hirer_id, title INTO job_hirer_id, job_title
  FROM public.jobs
  WHERE id = NEW.job_id;

  -- 2. Get provider name
  SELECT p.full_name INTO provider_name
  FROM public.profiles p
  JOIN public.provider_profiles pp ON pp.user_id = p.id
  WHERE pp.id = NEW.provider_id;

  -- 3. Insert notification for hirer
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    job_hirer_id,
    'application',
    'New application for ' || job_title,
    provider_name || ' has applied for your gig.',
    jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'provider_id', NEW.provider_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new applications
DROP TRIGGER IF EXISTS on_application_created ON public.applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_notification();

-- Function to notify provider on application status change
CREATE OR REPLACE FUNCTION public.handle_application_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  job_title TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only trigger on status change
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- 1. Get target user (provider)
    SELECT user_id INTO target_user_id
    FROM public.provider_profiles
    WHERE id = NEW.provider_id;

    -- 2. Get job title
    SELECT title INTO job_title
    FROM public.jobs
    WHERE id = NEW.job_id;

    -- 3. Define content based on status
    CASE NEW.status
      WHEN 'shortlisted' THEN
        notification_title := 'Application Shortlisted!';
        notification_body := 'You have been shortlisted for: ' || job_title;
      WHEN 'hired' THEN
        notification_title := 'You are Hired!';
        notification_body := 'Congratulations! You have been hired for: ' || job_title;
      WHEN 'rejected' THEN
        notification_title := 'Application Update';
        notification_body := 'The hirer has decided to move forward with other candidates for: ' || job_title;
      ELSE
        RETURN NEW;
    END CASE;

    -- 4. Insert notification
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      target_user_id,
      'application_update',
      notification_title,
      notification_body,
      jsonb_build_object(
        'application_id', NEW.id,
        'job_id', NEW.job_id,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for application status changes
DROP TRIGGER IF EXISTS on_application_status_updated ON public.applications;
CREATE TRIGGER on_application_status_updated
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_application_status_notification();
