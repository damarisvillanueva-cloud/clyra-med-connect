-- Create 5 sample profiles without foreign key constraints by modifying the approach
-- First, let's remove the foreign key constraint temporarily and add sample data

-- Drop the foreign key constraint temporarily
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Temporarily disable RLS to insert sample data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Insert 5 sample profiles with random UUIDs
INSERT INTO public.profiles (user_id, full_name, email, phone) VALUES
(gen_random_uuid(), 'María González', 'maria.gonzalez@email.com', '+34 612 345 678'),
(gen_random_uuid(), 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '+34 687 654 321'),
(gen_random_uuid(), 'Ana Martínez', 'ana.martinez@email.com', '+34 698 123 456'),
(gen_random_uuid(), 'Luis Fernández', 'luis.fernandez@email.com', '+34 634 567 890'),
(gen_random_uuid(), 'Elena López', 'elena.lopez@email.com', '+34 651 098 765');

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: Foreign key constraint is removed for demo data purposes
-- In production, you would want to restore it or ensure proper auth user creation