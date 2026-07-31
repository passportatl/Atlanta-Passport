# Passport Storefront

Status: approved for design; implementation follows the August 5 release freeze

Owner: Passport ATL commerce and product

Last updated: July 31, 2026

## Outcome

The Passport Storefront sells Passport ATL merchandise, Atlanta keepsakes,
member-exclusive drops, and reward-linked offers without requiring Passport ATL
to store card data or recreate mature commerce infrastructure.

## Existing foundation

- Members already have a Shop destination at `/passport/shop`.
- The current destination intentionally renders a coming-soon state.
- Visitor identities, rewards, redemptions, and partner organizations can
  provide future member and partner relationships.
- No production commerce schema or checkout workflow is assumed to exist.

## Commerce boundary

Use an established payment provider's hosted checkout and customer portal.
Passport ATL stores catalog, order, entitlement, and fulfillment references,
but never raw card numbers, security codes, or payment credentials.

Select the provider before implementation based on hosted checkout, tax and
shipping support, refunds, webhook reliability, product synchronization,
test-mode support, and total operating cost.

## Member experience

The catalog supports featured and member-exclusive products, filters, variants,
media, availability, fulfillment estimates, and complete essential purchase
text. The cart is authenticated and persistent. Prices and eligibility are
calculated by the server before hosted checkout. Members receive return/cancel
states, order confirmation, and order history.

## Staff experience

Staff can manage products, variants, availability, sale windows, fulfillment,
shipment references, refunds through the provider, support notes, and an audit
trail for price, inventory, refund, and fulfillment changes.

## Core data

- products, variants, media, prices, and inventory
- carts and cart items
- orders and immutable order-item snapshots
- payment-provider references
- shipments, refunds, discounts, and eligibility rules
- webhook events with idempotency keys

Money uses integer minor units and an explicit currency.

## Safety and reliability

- Checkout totals are calculated and verified on the server.
- Webhooks are signed, idempotent, replay-safe, and auditable.
- Inventory is rechecked before payment completion.
- A client redirect alone never triggers fulfillment.
- Secrets exist only in the deployment secret store.
- Order data has explicit retention and access rules.

## Delivery slices

1. Provider decision, data model, test catalog, and staff read-only view.
2. Member catalog and product pages without checkout.
3. Test-mode cart, hosted checkout, signed webhooks, and confirmation.
4. Fulfillment, refunds, history, notifications, and launch QA.

## Acceptance criteria

- Only authenticated members can use the storefront.
- Server calculations determine price, discount, and eligibility.
- Passport ATL never stores raw payment card data.
- Duplicate webhooks cannot duplicate orders or fulfillment.
- Product names and essential purchase details are never truncated.
- Members can find order status after checkout.
- Staff can trace an order through fulfillment or refund.
- Shop stays coming soon until checkout and refund pass end to end in test mode.

## Non-goals for the first release

- Marketplace payouts
- Multi-currency or international shipping
- Auctions or cryptocurrency
- Custom payment-card collection

