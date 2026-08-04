# Decision Records

Use short decision records for choices with lasting product or technical
consequences.

## Naming

Name records sequentially:

```text
0001-short-decision-title.md
```

## Template

```markdown
# 0001: Decision title

- Status: proposed
- Date: YYYY-MM-DD
- Owners: team or role

## Context

What forces and constraints require a decision?

## Decision

What is being chosen?

## Consequences

What becomes easier, harder, required, or intentionally deferred?

## Alternatives considered

What credible options were evaluated and why were they not selected?
```

Allowed statuses are `proposed`, `accepted`, `superseded`, and `deprecated`.
Do not rewrite an accepted decision to hide a changed direction; add a new
record and link the superseded one.
