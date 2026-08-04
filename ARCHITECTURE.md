# Passport ATL Architecture

## Purpose

Passport ATL is a mobile-first discovery and digital passport platform for
Atlanta destinations, events, neighborhoods, and partners. This document is a
high-level map of the current repository and the architectural guardrails for
Passport ATL 2.0.

## Repository map

| Area | Responsibility |
| --- | --- |
| `artifacts/atlanta-passport` | React/Vite visitor-facing web application |
| `artifacts/api-server` | Backend API and application services |
| `artifacts/mockup-sandbox` | Isolated interface prototypes |
| `lib/api-spec` | OpenAPI contract and client-generation configuration |
| `lib/api-client-react` | Generated React API client |
| `lib/api-zod` | Generated/shared API validation |
| `lib/db` | Database schema and persistence utilities |
| `scripts` | Workspace automation and operational scripts |
| `docs` | Product, engineering, operational, and release documentation |

## System boundaries

The web application consumes the API contract rather than database internals.
The API server owns business rules and persistence access. Shared libraries
provide contracts and generated integration code, while operational scripts
remain outside the request path.

```text
Visitor browser
    |
    v
React/Vite application
    |
    v
OpenAPI-defined API
    |
    v
API services --> database
    |
    +--> approved external content and identity providers
```

## Architectural principles

1. Keep the OpenAPI specification authoritative for client/server contracts.
2. Keep business rules on the server and presentation state in the client.
3. Treat location, event, partner, and stamp data as explicit domain concepts.
4. Design for accessible, responsive, and progressively enhanced experiences.
5. Isolate external providers behind adapters so failures degrade gracefully.
6. Pair schema or contract changes with migrations, generated artifacts, and
   documentation.
7. Add observability at system boundaries without collecting unnecessary
   personal data.

## Passport ATL 2.0

The 2.0 effort evolves the product incrementally. Proposed decisions belong in
`docs/passport-atl-2.0/decisions`, and accepted changes should update this file
when they alter stable system boundaries. The initial planning structure is
indexed in [docs/passport-atl-2.0/README.md](docs/passport-atl-2.0/README.md).
