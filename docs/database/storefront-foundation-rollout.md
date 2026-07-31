# Storefront Foundation Rollout

Status: design and code foundation only — do not apply to production

Migration:
[`2026-07-31-storefront-foundation.sql`](sql/2026-07-31-storefront-foundation.sql)

## Scope

This additive migration creates catalog, variant, inventory, cart, order,
immutable order-item snapshot, webhook-idempotency, shipment, and refund tables.
It does not enable the Shop UI, checkout, payment webhooks, or fulfillment.

## Preconditions

- A commerce provider has been selected and reviewed.
- Provider test-mode credentials exist only in the deployment secret store.
- Production has a verified backup and disposable restore.
- The SQL has passed against the disposable restore.
- Data retention and staff access rules are approved.
- Checkout remains behind a disabled feature flag.

## Rehearsal

1. Restore a current production backup into a disposable database.
2. Record baseline row counts and schema state.
3. Apply the migration once.
4. Apply it a second time to verify safe `IF NOT EXISTS` behavior.
5. Confirm all new tables are empty.
6. Insert a draft product, variant, inventory row, cart, and pending order.
7. Verify the database rejects negative money, invalid quantity, incorrect
   totals, and duplicate provider event IDs.
8. Delete the disposable database.

## Rollback

Before checkout is enabled and while every storefront table is empty, rollback
may drop tables in this order:

1. `storefront_refunds`
2. `storefront_shipments`
3. `storefront_webhook_events`
4. `storefront_order_items`
5. `storefront_orders`
6. `storefront_cart_items`
7. `storefront_carts`
8. `storefront_inventory`
9. `storefront_variants`
10. `storefront_products`

After any real order exists, do not drop commerce tables. Disable checkout,
preserve financial history, and use a reviewed forward migration.

## Release decision

No-go until hosted checkout, signed webhook verification, replay testing,
refund testing, inventory reconciliation, order history, and staff fulfillment
have each passed in provider test mode.
