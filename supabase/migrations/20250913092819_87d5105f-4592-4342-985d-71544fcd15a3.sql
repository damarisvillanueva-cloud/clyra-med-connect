-- Fix trigger permissions for handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample medicines
INSERT INTO public.medicines (name, generic_name, category, manufacturer, description) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Analgésicos', 'Laboratorios Bago', 'Analgésico y antipirético para dolor y fiebre'),
('Ibuprofeno 400mg', 'Ibuprofeno', 'Antiinflamatorios', 'Pfizer', 'Antiinflamatorio no esteroideo para dolor e inflamación'),
('Amoxicilina 500mg', 'Amoxicilina', 'Antibióticos', 'Roche', 'Antibiótico de amplio espectro'),
('Omeprazol 20mg', 'Omeprazol', 'Protectores Gástricos', 'AstraZeneca', 'Inhibidor de la bomba de protones'),
('Loratadina 10mg', 'Loratadina', 'Antihistamínicos', 'Merck', 'Antihistamínico para alergias'),
('Simvastatina 20mg', 'Simvastatina', 'Cardiovasculares', 'Laboratorios Chile', 'Reductor del colesterol'),
('Metformina 850mg', 'Metformina', 'Antidiabéticos', 'Novartis', 'Antidiabético oral'),
('Salbutamol 100mcg', 'Salbutamol', 'Respiratorios', 'GlaxoSmithKline', 'Broncodilatador para asma'),
('Diclofenaco 50mg', 'Diclofenaco', 'Antiinflamatorios', 'Voltaren', 'Antiinflamatorio para dolor articular'),
('Enalapril 10mg', 'Enalapril', 'Cardiovasculares', 'Laboratorios Andrómaco', 'Antihipertensivo IECA')
ON CONFLICT (name) DO NOTHING;

-- Insert sample pharmacies
INSERT INTO public.pharmacies (name, address, phone, latitude, longitude, rating, review_count) VALUES
('Farmacia Cruz Verde', 'Av. Providencia 1234, Providencia', '+56 2 2345 6789', -33.4489, -70.6693, 4.2, 156),
('Farmacias Ahumada', 'Av. Las Condes 5678, Las Condes', '+56 2 3456 7890', -33.4372, -70.5436, 4.0, 203),
('Farmacia Salcobrand', 'Av. Apoquindo 9012, Las Condes', '+56 2 4567 8901', -33.4284, -70.5387, 4.3, 89),
('Farmacia Dr. Simi', 'Av. Brasil 3456, Valparaíso', '+56 32 567 8901', -33.0458, -71.6197, 3.8, 145),
('Farmacia Popular', 'Calle Principal 789, Viña del Mar', '+56 32 678 9012', -33.0153, -71.5500, 4.1, 78),
('Farmacia Central', 'Av. Libertador 2345, Santiago Centro', '+56 2 5678 9012', -33.4378, -70.6504, 3.9, 234),
('Farmacia San Juan', 'Av. San Juan 6789, La Serena', '+56 51 789 0123', -29.9027, -71.2519, 4.4, 67),
('Farmacia del Pueblo', 'Calle Comercio 4567, Concepción', '+56 41 890 1234', -36.8270, -73.0448, 4.0, 112)
ON CONFLICT (name, address) DO NOTHING;

-- Insert pharmacy_medicines relationships with prices and stock
WITH medicine_ids AS (
  SELECT id, name FROM medicines LIMIT 10
),
pharmacy_ids AS (
  SELECT id, name FROM pharmacies LIMIT 8
)
INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, quantity, stock_status)
SELECT 
  p.id,
  m.id,
  CASE 
    WHEN m.name LIKE '%Paracetamol%' THEN 2500 + (RANDOM() * 1000)::INTEGER
    WHEN m.name LIKE '%Ibuprofeno%' THEN 3200 + (RANDOM() * 800)::INTEGER
    WHEN m.name LIKE '%Amoxicilina%' THEN 8500 + (RANDOM() * 2000)::INTEGER
    WHEN m.name LIKE '%Omeprazol%' THEN 6800 + (RANDOM() * 1500)::INTEGER
    WHEN m.name LIKE '%Loratadina%' THEN 4200 + (RANDOM() * 1200)::INTEGER
    WHEN m.name LIKE '%Simvastatina%' THEN 12000 + (RANDOM() * 3000)::INTEGER
    WHEN m.name LIKE '%Metformina%' THEN 5500 + (RANDOM() * 1800)::INTEGER
    WHEN m.name LIKE '%Salbutamol%' THEN 15000 + (RANDOM() * 4000)::INTEGER
    WHEN m.name LIKE '%Diclofenaco%' THEN 4800 + (RANDOM() * 1400)::INTEGER
    ELSE 7500 + (RANDOM() * 2500)::INTEGER
  END,
  (RANDOM() * 50 + 10)::INTEGER,
  CASE 
    WHEN RANDOM() > 0.8 THEN 'out_of_stock'
    WHEN RANDOM() > 0.9 THEN 'low_stock'
    ELSE 'in_stock'
  END
FROM pharmacy_ids p
CROSS JOIN medicine_ids m
WHERE RANDOM() > 0.3  -- Only create relationships for ~70% of combinations
ON CONFLICT DO NOTHING;