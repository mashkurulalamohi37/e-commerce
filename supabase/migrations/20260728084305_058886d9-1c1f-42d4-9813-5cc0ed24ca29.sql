-- Real-time stock check for a set of requested items
CREATE OR REPLACE FUNCTION public.check_stock(_items jsonb)
RETURNS TABLE (product_id uuid, name text, requested integer, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, (i->>'qty')::int, p.stock
  FROM jsonb_array_elements(_items) AS i
  JOIN public.products p ON p.id = (i->>'product_id')::uuid
$$;

REVOKE ALL ON FUNCTION public.check_stock(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_stock(jsonb) TO service_role;

-- Atomically decrement inventory for a confirmed order
CREATE OR REPLACE FUNCTION public.confirm_order_and_decrement_stock(_order_id uuid, _payment_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  updated_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.orders o WHERE o.id = _order_id AND o.payment_status = 'paid') THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT oi.product_id, oi.name, sum(oi.qty)::int AS qty
    FROM public.order_items oi
    WHERE oi.order_id = _order_id AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id, oi.name
    ORDER BY oi.product_id
  LOOP
    UPDATE public.products p
    SET stock = p.stock - r.qty, updated_at = now()
    WHERE p.id = r.product_id AND p.stock >= r.qty
    RETURNING p.id INTO updated_id;

    IF updated_id IS NULL THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', r.name;
    END IF;
    updated_id := NULL;
  END LOOP;

  UPDATE public.orders
  SET payment_status = 'paid',
      payment_reference = COALESCE(_payment_reference, payment_reference),
      status = 'confirmed',
      updated_at = now()
  WHERE id = _order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order_and_decrement_stock(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_decrement_stock(uuid, text) TO service_role;