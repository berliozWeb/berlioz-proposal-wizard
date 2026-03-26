-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  price_per_person numeric NOT NULL DEFAULT 0,
  image_url text,
  occasion text[] DEFAULT '{}',
  dietary_tags text[] DEFAULT '{}',
  included_items text[] DEFAULT '{}',
  is_bestseller boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);

-- Quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text,
  event_type text NOT NULL,
  people_count integer NOT NULL,
  event_date date,
  time_slot text,
  dietary_restrictions text[] DEFAULT '{}',
  budget_per_person numeric,
  ai_options jsonb DEFAULT '[]',
  selected_option_index integer,
  status text NOT NULL DEFAULT 'draft',
  total_estimated numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own quotes" ON public.quotes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Discount codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'fixed',
  min_order numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active discount codes" ON public.discount_codes FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Seed some sample products
INSERT INTO public.products (name, slug, description, short_description, price_per_person, occasion, dietary_tags, included_items, is_bestseller, sort_order) VALUES
('Box Ejecutiva', 'box-ejecutiva', 'Lunch box gourmet con proteína premium, guarnición y postre artesanal', 'Proteína premium + guarnición + postre', 350, '{"working_lunch","junta"}', '{}', '{"Proteína del día","Arroz o pasta","Ensalada fresca","Postre artesanal","Agua natural 600ml"}', true, 1),
('Box Clásica', 'box-clasica', 'Nuestra lunch box más popular con opciones variadas y postre', 'La favorita del equipo', 280, '{"working_lunch","comida"}', '{}', '{"Proteína del día","Guarnición","Ensalada","Postre","Agua natural"}', true, 2),
('Desayuno Continental', 'desayuno-continental', 'Pan artesanal, frutas, yogurt, jugo natural y café', 'El clásico para arrancar el día', 185, '{"desayuno"}', '{"vegetariano"}', '{"Pan artesanal surtido","Fruta de temporada","Yogurt con granola","Jugo natural","Café de especialidad"}', false, 3),
('Coffee Break AM', 'coffee-break-am', 'Café de especialidad, pan dulce artesanal y snacks salados', 'Energía para la mañana', 145, '{"coffee_am"}', '{"vegetariano"}', '{"Café de especialidad","Pan dulce artesanal","Mini sándwiches","Fruta picada"}', true, 4),
('Coffee Break PM', 'coffee-break-pm', 'Galletas, brownies artesanales, café y té', 'El break perfecto de la tarde', 145, '{"coffee_pm"}', '{"vegetariano"}', '{"Brownies artesanales","Galletas variadas","Café de especialidad","Selección de tés"}', false, 5),
('Box Vegana', 'box-vegana', 'Lunch box 100% plant-based con proteína vegetal y superfoods', 'Sabor sin compromiso', 240, '{"working_lunch","vegano"}', '{"vegano","sin_lactosa"}', '{"Bowl de quinoa","Proteína vegetal","Ensalada de superfoods","Postre vegano","Agua natural"}', false, 6),
('Box Sin Gluten', 'box-sin-gluten', 'Lunch box libre de gluten con ingredientes certificados', 'Segura y deliciosa', 260, '{"working_lunch","vegano"}', '{"sin_gluten"}', '{"Proteína a la plancha","Arroz integral","Ensalada mixta","Fruta de temporada","Agua natural"}', false, 7),
('Junta Ejecutiva Premium', 'junta-ejecutiva-premium', 'Servicio VIP con presentación ejecutiva y opciones gourmet', 'Para impresionar', 450, '{"junta"}', '{}', '{"Canapés gourmet","Proteína premium","Guarniciones selectas","Postre de autor","Bebidas premium"}', true, 8),
('Desayuno Saludable', 'desayuno-saludable', 'Avena overnight, smoothie bowl, fruta y granola casera', 'Arranque nutritivo', 195, '{"desayuno"}', '{"vegetariano","sin_gluten"}', '{"Avena overnight","Smoothie bowl","Fruta picada","Granola casera","Jugo verde"}', false, 9),
('Box Económica', 'box-economica', 'Opción accesible sin sacrificar calidad', 'Calidad al mejor precio', 180, '{"working_lunch","comida"}', '{}', '{"Proteína del día","Arroz","Frijoles","Tortillas","Agua natural"}', false, 10);
