-- Events & Placement persistence tables

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  category TEXT DEFAULT 'Other',
  organizer TEXT DEFAULT '',
  capacity INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'declined', 'maybe')),
  guests_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT DEFAULT '',
  responded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placement_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT DEFAULT '',
  website TEXT DEFAULT '',
  contacts TEXT DEFAULT '',
  past_drives INTEGER DEFAULT 0,
  offers_made INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placement_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  student TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'shortlisted', 'placed', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.interview_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_id UUID NOT NULL REFERENCES public.placement_registrations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed')),
  feedback TEXT DEFAULT '',
  conducted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON public.event_ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_event ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_placement_companies_name ON public.placement_companies(name);
CREATE INDEX IF NOT EXISTS idx_placement_registrations_job ON public.placement_registrations(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_interview_stages_reg ON public.interview_stages(reg_id);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_stages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "events select authenticated" ON public.events FOR SELECT TO authenticated USING (true);
  CREATE POLICY "events insert authenticated" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "events update authenticated" ON public.events FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "events delete authenticated" ON public.events FOR DELETE TO authenticated USING (true);

  CREATE POLICY "event_rsvps select authenticated" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
  CREATE POLICY "event_rsvps insert authenticated" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "event_rsvps update authenticated" ON public.event_rsvps FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "event_rsvps delete authenticated" ON public.event_rsvps FOR DELETE TO authenticated USING (true);

  CREATE POLICY "event_tickets select authenticated" ON public.event_ticket_types FOR SELECT TO authenticated USING (true);
  CREATE POLICY "event_tickets insert authenticated" ON public.event_ticket_types FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "event_tickets update authenticated" ON public.event_ticket_types FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "event_tickets delete authenticated" ON public.event_ticket_types FOR DELETE TO authenticated USING (true);

  CREATE POLICY "event_photos select authenticated" ON public.event_photos FOR SELECT TO authenticated USING (true);
  CREATE POLICY "event_photos insert authenticated" ON public.event_photos FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "event_photos delete authenticated" ON public.event_photos FOR DELETE TO authenticated USING (true);

  CREATE POLICY "placement_companies select" ON public.placement_companies FOR SELECT TO authenticated USING (true);
  CREATE POLICY "placement_companies insert" ON public.placement_companies FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "placement_companies update" ON public.placement_companies FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "placement_companies delete" ON public.placement_companies FOR DELETE TO authenticated USING (true);

  CREATE POLICY "placement_registrations select" ON public.placement_registrations FOR SELECT TO authenticated USING (true);
  CREATE POLICY "placement_registrations insert" ON public.placement_registrations FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "placement_registrations update" ON public.placement_registrations FOR UPDATE TO authenticated USING (true);

  CREATE POLICY "interview_stages select" ON public.interview_stages FOR SELECT TO authenticated USING (true);
  CREATE POLICY "interview_stages insert" ON public.interview_stages FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "interview_stages update" ON public.interview_stages FOR UPDATE TO authenticated USING (true);
  CREATE POLICY "interview_stages delete" ON public.interview_stages FOR DELETE TO authenticated USING (true);
END $$;
