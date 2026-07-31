import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { visitorsTable } from "./visitors";

export const storefrontProductsTable = pgTable(
  "storefront_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull().default("merchandise"),
    status: text("status").notNull().default("draft"),
    memberOnly: boolean("member_only").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    mediaUrls: text("media_urls").array().notNull().default([]),
    availableFrom: timestamp("available_from", { withTimezone: true }),
    availableUntil: timestamp("available_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("storefront_products_slug_unique").on(table.slug),
    index("storefront_products_status_featured_idx").on(
      table.status,
      table.isFeatured,
    ),
  ],
);

export const storefrontVariantsTable = pgTable(
  "storefront_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => storefrontProductsTable.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    optionValues: jsonb("option_values")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    status: text("status").notNull().default("active"),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    providerProductId: text("provider_product_id"),
    providerPriceId: text("provider_price_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("storefront_variants_sku_unique").on(table.sku),
    index("storefront_variants_product_status_idx").on(
      table.productId,
      table.status,
    ),
  ],
);

export const storefrontInventoryTable = pgTable(
  "storefront_inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => storefrontVariantsTable.id, { onDelete: "cascade" }),
    availableQuantity: integer("available_quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    trackInventory: boolean("track_inventory").notNull().default(true),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("storefront_inventory_variant_unique").on(table.variantId),
  ],
);

export const storefrontCartsTable = pgTable(
  "storefront_carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitorsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    currency: text("currency").notNull().default("usd"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("storefront_carts_visitor_status_idx").on(
      table.visitorId,
      table.status,
    ),
  ],
);

export const storefrontCartItemsTable = pgTable(
  "storefront_cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => storefrontCartsTable.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => storefrontVariantsTable.id),
    quantity: integer("quantity").notNull(),
    unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("storefront_cart_items_cart_variant_unique").on(
      table.cartId,
      table.variantId,
    ),
  ],
);

export const storefrontOrdersTable = pgTable(
  "storefront_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id").references(() => visitorsTable.id, {
      onDelete: "set null",
    }),
    cartId: uuid("cart_id").references(() => storefrontCartsTable.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending_payment"),
    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),
    provider: text("provider"),
    providerCustomerId: text("provider_customer_id"),
    providerCheckoutSessionId: text("provider_checkout_session_id"),
    providerPaymentId: text("provider_payment_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("storefront_orders_visitor_created_idx").on(
      table.visitorId,
      table.createdAt,
    ),
    uniqueIndex("storefront_orders_checkout_session_unique").on(
      table.providerCheckoutSessionId,
    ),
    uniqueIndex("storefront_orders_payment_unique").on(table.providerPaymentId),
  ],
);

export const storefrontOrderItemsTable = pgTable(
  "storefront_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => storefrontOrdersTable.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => storefrontVariantsTable.id, {
      onDelete: "set null",
    }),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    variantNameSnapshot: text("variant_name_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("storefront_order_items_order_idx").on(table.orderId)],
);

export const storefrontWebhookEventsTable = pgTable(
  "storefront_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: text("status").notNull().default("processing"),
    attemptCount: integer("attempt_count").notNull().default(1),
    lastError: text("last_error"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("storefront_webhook_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const storefrontShipmentsTable = pgTable(
  "storefront_shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => storefrontOrdersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("storefront_shipments_order_idx").on(table.orderId)],
);

export const storefrontRefundsTable = pgTable(
  "storefront_refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => storefrontOrdersTable.id),
    status: text("status").notNull().default("pending"),
    amountCents: integer("amount_cents").notNull(),
    reason: text("reason"),
    providerRefundId: text("provider_refund_id"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("storefront_refunds_order_idx").on(table.orderId),
    uniqueIndex("storefront_refunds_provider_unique").on(
      table.providerRefundId,
    ),
  ],
);
