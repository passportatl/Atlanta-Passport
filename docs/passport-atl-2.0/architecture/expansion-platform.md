# Expansion Platform Architecture

Status: proposed implementation boundary

Last updated: July 31, 2026

## Purpose

ATL Legends, the Passport Storefront, and AI-driven routes are separate member
products, but share identity, authorization, canonical content relationships,
activity logging, analytics conventions, and release discipline.

## Shared rules

- Work begins from `develop`, never from the frozen August 5 release branch.
- Each product ships through separate, reviewable delivery slices.
- Member APIs expose only publishable or member-owned records.
- Staff writes require action-based permissions and activity logs.
- Canonical locations, events, and routes use stable IDs.
- Meaningful text is never truncated.
- Every screen presents a clear next action.
- Kill switches protect unfinished public surfaces.
- No migration is applied without rehearsed rollout and rollback.

## Recommended delivery order

1. **ATL Legends:** existing schema and placeholders make it the smallest
   end-to-end product.
2. **AI route validator:** deterministic quality infrastructure before a model.
3. **Storefront foundation:** choose a provider and model catalog/orders before
   checkout.
4. **AI staff sandbox:** constrained generation only after validation passes.
5. **Storefront checkout:** provider test mode through refund and webhook replay
   tests before launch.

## Branch boundaries

- `feature/atl-legends-foundation`
- `feature/ai-route-validator`
- `feature/storefront-foundation`

Do not combine their application code into one pull request.

## Release protection

The August 5 release remains frozen on `release/2026-08-05`. Expansion branches
merge only to `develop` and cannot enter the launch release without an explicit
scope decision and a new readiness review.
