CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL DEFAULT 'hero',
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  kicker text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  cta_href text NOT NULL DEFAULT '/offers',
  image_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'dark',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active banners are public" ON public.banners
FOR SELECT USING (active = true);

CREATE POLICY "Admins read all banners" ON public.banners
FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write banners" ON public.banners
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER banners_touch_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.banners (placement, kicker, title, subtitle, cta_label, cta_href, image_url, alt, tone, sort_order) VALUES
('hero', 'New season edit', 'Glow that travels well in Dhaka weather', 'Lightweight serums and barrier creams built for humidity.', 'Shop the offers', '/offers', '/banners/hero-1.jpg', 'Glass serum bottle and cream jar on draped linen in warm daylight', 'dark', 1),
('hero', 'Best sellers', 'The routine our customers reorder most', 'Vitamin C, niacinamide and ceramides — restocked weekly.', 'Shop best sellers', '/search', '/banners/hero-2.jpg', 'Row of skincare bottles arranged on a soft pink studio backdrop', 'dark', 2),
('hero', 'Makeup', 'Colour that lasts from office to iftar', 'Long-wear lips and skin tints in shades made for us.', 'Explore makeup', '/categories', '/banners/hero-3.jpg', 'Open lipstick bullet and compact powder on a marble surface', 'dark', 3),
('offer', 'Save up to 40%', 'Beauty must haves', 'Everyday essentials at bundle prices.', 'Shop now', '/offers', '/banners/offer-1.jpg', 'Skincare essentials grouped together with a discount tag', 'dark', 1),
('offer', 'Buy 1 get 1', 'Double the glow', 'Selected serums and masks, this week only.', 'Grab the deal', '/offers', '/banners/offer-2.jpg', 'Two matching serum bottles side by side on a pastel background', 'dark', 2),
('offer', 'Combo packs', 'Build your routine', 'Cleanse, treat and moisturise for less.', 'View combos', '/offers', '/banners/offer-3.jpg', 'Cleanser, serum and moisturiser arranged as a routine set', 'light', 3);