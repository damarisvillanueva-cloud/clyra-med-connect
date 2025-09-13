-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  description TEXT,
  manufacturer TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacies table
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacy_medicines table for stock and pricing
CREATE TABLE public.pharmacy_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  stock_status TEXT NOT NULL CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id, medicine_id)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search_history table
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for medicines (public read)
CREATE POLICY "Anyone can view medicines" 
ON public.medicines 
FOR SELECT 
USING (true);

-- Create RLS policies for pharmacies (public read)
CREATE POLICY "Anyone can view pharmacies" 
ON public.pharmacies 
FOR SELECT 
USING (true);

-- Create RLS policies for pharmacy_medicines (public read)
CREATE POLICY "Anyone can view pharmacy medicines" 
ON public.pharmacy_medicines 
FOR SELECT 
USING (true);

-- Create RLS policies for reservations
CREATE POLICY "Users can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" 
ON public.search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" 
ON public.search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_medicines_updated_at
  BEFORE UPDATE ON public.pharmacy_medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.medicines (name, generic_name, description, manufacturer, category) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pain reliever and fever reducer', 'Farmacia ABC', 'Analgesic'),
('Ibuprofeno 400mg', 'Ibuprofen', 'Anti-inflammatory and pain reliever', 'Laboratorios XYZ', 'NSAID'),
('Amoxicilina 500mg', 'Amoxicillin', 'Antibiotic for bacterial infections', 'Medicina SA', 'Antibiotic'),
('Omeprazol 20mg', 'Omeprazole', 'Proton pump inhibitor for acid reflux', 'Pharma Plus', 'PPI'),
('Loratadina 10mg', 'Loratadine', 'Antihistamine for allergies', 'AllerMed', 'Antihistamine');

INSERT INTO public.pharmacies (name, address, latitude, longitude, phone, rating, review_count) VALUES
('Farmacia Central', 'Av. Principal 123, Centro', 19.4326, -99.1332, '+52 55 1234 5678', 4.5, 120),
('Farmacia del Norte', 'Calle Norte 456, Zona Norte', 19.4978, -99.1269, '+52 55 2345 6789', 4.2, 85),
('Farmacia Sur', 'Av. Sur 789, Zona Sur', 19.3910, -99.1429, '+52 55 3456 7890', 4.7, 200),
('Farmacia 24 Horas', 'Blvd. Comercial 321, Plaza Centro', 19.4267, -99.1716, '+52 55 4567 8901', 4.0, 95),
('Farmacia Moderna', 'Calle Reforma 654, Colonia Centro', 19.4355, -99.1398, '+52 55 5678 9012', 4.6, 150);

-- Insert sample pharmacy medicines data
INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock_status, quantity) 
SELECT 
  p.id,
  m.id,
  CASE 
    WHEN m.name LIKE '%Paracetamol%' THEN 15.50
    WHEN m.name LIKE '%Ibuprofeno%' THEN 22.00
    WHEN m.name LIKE '%Amoxicilina%' THEN 45.00
    WHEN m.name LIKE '%Omeprazol%' THEN 38.50
    WHEN m.name LIKE '%Loratadina%' THEN 28.00
  END + (RANDOM() * 10 - 5), -- Add some price variation
  CASE 
    WHEN RANDOM() < 0.1 THEN 'out_of_stock'
    WHEN RANDOM() < 0.3 THEN 'low_stock'
    ELSE 'in_stock'
  END,
  FLOOR(RANDOM() * 50 + 1)::INTEGER
FROM public.pharmacies p
CROSS JOIN public.medicines m;