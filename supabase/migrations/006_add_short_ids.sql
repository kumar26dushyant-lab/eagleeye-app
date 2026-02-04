-- Add short_id columns for human-readable ticket/inquiry IDs

-- Add short_id to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Add short_id to inquiries
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_support_tickets_short_id ON public.support_tickets(short_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_short_id ON public.inquiries(short_id);
