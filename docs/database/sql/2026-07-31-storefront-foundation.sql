-- Passport ATL Storefront foundation
-- Additive only. Rehearse against a disposable restore before production.

BEGIN;

CREATE TABLE IF NOT EXISTS storefront_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'merchandise',
  status text NOT NULL DEFAULT 'draft',
  member_only boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  media_urls text[] NOT NULL DEFAULT '{}',
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_products_availability_check
    CHECK (available_until IS NULL OR available_from IS NULL OR available_until > available_from)
);

CREATE INDEX IF NOT EXISTS storefront_products_status_featured_idx
  ON storefront_products (status, is_featured);

CREATE TABLE IF NOT EXISTS storefront_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES storefront_products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  option_values jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency ~ '^[a-z]{3}$'),
  provider_product_id text,
  provider_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_variants_product_status_idx
  ON storefront_variants (product_id, status);

CREATE TABLE IF NOT EXISTS storefront_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL UNIQUE REFERENCES storefront_variants(id) ON DELETE CASCADE,
  available_quantity integer NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  reserved_quantity integer NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  track_inventory boolean NOT NULL DEFAULT true,
  allow_backorder boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  currency text NOT NULL DEFAULT 'usd' CHECK (currency ~ '^[a-z]{3}$'),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_carts_visitor_status_idx
  ON storefront_carts (visitor_id, status);

CREATE TABLE IF NOT EXISTS storefront_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES storefront_carts(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES storefront_variants(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents_snapshot integer NOT NULL CHECK (unit_price_cents_snapshot >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_cart_items_cart_variant_unique UNIQUE (cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS storefront_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid REFERENCES visitors(id) ON DELETE SET NULL,
  cart_id uuid REFERENCES storefront_carts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending_payment',
  currency text NOT NULL DEFAULT 'usd' CHECK (currency ~ '^[a-z]{3}$'),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  shipping_cents integer NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  customer_email text,
  shipping_address jsonb,
  provider text,
  provider_customer_id text,
  provider_checkout_session_id text UNIQUE,
  provider_payment_id text UNIQUE,
  paid_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_orders_total_check
    CHECK (total_cents = subtotal_cents - discount_cents + shipping_cents + tax_cents),
  CONSTRAINT storefront_orders_discount_check
    CHECK (discount_cents <= subtotal_cents)
);

CREATE INDEX IF NOT EXISTS storefront_orders_visitor_created_idx
  ON storefront_orders (visitor_id, created_at);

CREATE TABLE IF NOT EXISTS storefront_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES storefront_orders(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES storefront_variants(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  variant_name_snapshot text NOT NULL,
  sku_snapshot text NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_cents integer NOT NULL CHECK (line_total_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_order_items_total_check
    CHECK (line_total_cents = unit_price_cents * quantity)
);

CREATE INDEX IF NOT EXISTS storefront_order_items_order_idx
  ON storefront_order_items (order_id);

CREATE TABLE IF NOT EXISTS storefront_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storefront_webhook_provider_event_unique
    UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS storefront_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES storefront_orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  carrier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_shipments_order_idx
  ON storefront_shipments (order_id);

CREATE TABLE IF NOT EXISTS storefront_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES storefront_orders(id),
  status text NOT NULL DEFAULT 'pending',
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  reason text,
  provider_refund_id text UNIQUE,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_refunds_order_idx
  ON storefront_refunds (order_id);

COMMIT;
