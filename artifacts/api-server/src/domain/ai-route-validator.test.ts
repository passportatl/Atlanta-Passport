import { describe, expect, it } from "vitest";
import {
  validateGeneratedRoute,
  type RouteCandidate,
  type RouteValidationRequest,
} from "./ai-route-validator";

const NOW = new Date("2026-07-31T12:00:00.000Z");

function candidate(
  overrides: Partial<RouteCandidate> & Pick<RouteCandidate, "id" | "name">,
): RouteCandidate {
  return {
    kind: "location",
    publicStatus: "published",
    isActive: true,
    verificationStatus: "verified",
    verifiedAt: new Date("2026-07-30T12:00:00.000Z"),
    minimumAge: null,
    accessibility: "confirmed",
    costCents: 1_500,
    minimumVisitMinutes: 45,
    availability: [{ startMinute: 600, endMinute: 1_200 }],
    ...overrides,
  };
}

const request: RouteValidationRequest = {
  routeStartMinute: 600,
  routeEndMinute: 1_000,
  youngestTravelerAge: 25,
  budgetCents: 5_000,
  requiresAccessibleStops: true,
  mustIncludeCandidateIds: ["museum"],
  maxLegDistanceMiles: 8,
  maxVerificationAgeDays: 30,
  now: NOW,
};

describe("validateGeneratedRoute", () => {
  it("accepts a verified, feasible route", () => {
    const result = validateGeneratedRoute(
      request,
      [
        candidate({ id: "museum", name: "Museum" }),
        candidate({ id: "restaurant", name: "Restaurant", costCents: 2_000 }),
      ],
      [
        { candidateId: "museum", arrivalMinute: 620, departureMinute: 680 },
        {
          candidateId: "restaurant",
          arrivalMinute: 700,
          departureMinute: 760,
        },
      ],
      [
        {
          fromCandidateId: "museum",
          toCandidateId: "restaurant",
          durationMinutes: 15,
          distanceMiles: 2.5,
        },
      ],
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.metrics).toMatchObject({
      stopCount: 2,
      knownCostCents: 3_500,
      unknownCostCount: 0,
    });
  });

  it("rejects an ID the model was not given", () => {
    const result = validateGeneratedRoute(
      request,
      [candidate({ id: "museum", name: "Museum" })],
      [
        {
          candidateId: "invented-place",
          arrivalMinute: 620,
          departureMinute: 680,
        },
      ],
      [],
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain(
      "candidate_not_supplied",
    );
  });

  it("rejects unpublished, stale, closed, and age-incompatible stops", () => {
    const result = validateGeneratedRoute(
      { ...request, youngestTravelerAge: 17 },
      [
        candidate({
          id: "museum",
          name: "Museum",
          publicStatus: "draft",
          verifiedAt: new Date("2026-01-01T12:00:00.000Z"),
          minimumAge: 21,
          availability: [{ startMinute: 800, endMinute: 900 }],
        }),
      ],
      [{ candidateId: "museum", arrivalMinute: 620, departureMinute: 680 }],
      [],
    );

    expect(result.errors.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "candidate_not_publishable",
        "candidate_stale",
        "outside_availability",
        "age_incompatible",
      ]),
    );
  });

  it("rejects duplicate, inaccessible, over-budget, and infeasible travel", () => {
    const result = validateGeneratedRoute(
      { ...request, budgetCents: 1_000 },
      [
        candidate({
          id: "museum",
          name: "Museum",
          accessibility: "unknown",
          costCents: 1_500,
        }),
      ],
      [
        { candidateId: "museum", arrivalMinute: 620, departureMinute: 680 },
        { candidateId: "museum", arrivalMinute: 685, departureMinute: 745 },
      ],
      [
        {
          fromCandidateId: "museum",
          toCandidateId: "museum",
          durationMinutes: 20,
          distanceMiles: 12,
        },
      ],
    );

    expect(result.errors.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "duplicate_stop",
        "accessibility_not_confirmed",
        "travel_time_conflict",
        "travel_distance_exceeded",
        "budget_exceeded",
      ]),
    );
  });

  it("requires known availability and reports unknown costs", () => {
    const result = validateGeneratedRoute(
      request,
      [
        candidate({
          id: "museum",
          name: "Museum",
          availability: [],
          costCents: null,
        }),
      ],
      [{ candidateId: "museum", arrivalMinute: 620, departureMinute: 680 }],
      [],
    );

    expect(result.valid).toBe(false);
    expect(result.errors.map((entry) => entry.code)).toContain(
      "availability_unknown",
    );
    expect(result.warnings.map((entry) => entry.code)).toContain(
      "cost_unknown",
    );
  });
});
