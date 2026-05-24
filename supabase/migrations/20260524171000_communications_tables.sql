-- Patch 9: Communication Templates & Campaign Engine Tables

CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  institution_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  audience_filter JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.message_campaigns(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent', 'teacher', 'staff')),
  recipient_id UUID,
  recipient_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_status ON public.message_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_scheduled ON public.message_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_campaign ON public.message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON public.message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON public.message_logs(recipient_address);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view templates in their institution"
  ON public.message_templates FOR SELECT
  USING (institution_id IS NULL OR institution_id IN (
    SELECT id FROM public.institutions WHERE id = institution_id
  ));

CREATE POLICY "Users can create templates"
  ON public.message_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.message_templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view campaigns"
  ON public.message_campaigns FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create campaigns"
  ON public.message_campaigns FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.message_campaigns FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view logs for own campaigns"
  ON public.message_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.message_campaigns WHERE id = campaign_id AND created_by = auth.uid()
  ));

CREATE POLICY "System can insert logs"
  ON public.message_logs FOR INSERT
  WITH CHECK (true);
