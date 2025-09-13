-- Fix security issues by enabling RLS on all tables that have policies but RLS disabled
-- These tables have policies but RLS was disabled

-- Enable RLS on medicines table
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pharmacies table  
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pharmacy_medicines table
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reservations table
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on search_history table
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Profiles table RLS was already re-enabled in the previous migration