-- Add phone number column to profiles table
-- This captures phone numbers provided during checkout (optional field)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone lookups (useful for WhatsApp integration)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Also add phone to subscriptions table for direct lookup from payment data
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMENT ON COLUMN public.profiles.phone IS 'Phone number provided during checkout (optional)';
COMMENT ON COLUMN public.subscriptions.customer_phone IS 'Phone number from payment provider';
