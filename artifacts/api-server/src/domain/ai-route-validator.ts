export type RouteCandidateKind = "location" | "event";

export type AvailabilityWindow = {
  startMinute: number;
  endMinute: number;
};

export type RouteCandidate = {
  id: string;
  kind: RouteCandidateKind;
  name: string;
  publicStatus: "published" | "draft" | "archived" | "canceled";
  isActive: boolean;
  verificationStatus: "verified" | "needs_review";
  verifiedAt: Date | null;
  minimumAge: number | null;
  accessibility: "confirmed" | "unknown" | "not_accessible";
  costCents: number | null;
  minimumVisitMinutes: number;
  availability: AvailabilityWindow[];
};

export type ProposedRouteStop = {
  candidateId: string;
  arrivalMinute: number;
  departureMinute: number;
};

export type ProposedTravelLeg = {
  fromCandidateId: string;
  toCandidateId: string;
  durationMinutes: number;
  distanceMiles: number;
};

export type RouteValidationRequest = {
  routeStartMinute: number;
  routeEndMinute: number;
  youngestTravelerAge: number | null;
  budgetCents: number | null;
  requiresAccessibleStops: boolean;
  mustIncludeCandidateIds: string[];
  maxLegDistanceMiles: number;
  maxVerificationAgeDays: number;
  now: Date;
};

export type RouteValidationIssue = {
  code:
    | "candidate_not_supplied"
    | "candidate_not_publishable"
    | "candidate_unverified"
    | "candidate_stale"
    | "duplicate_stop"
    | "invalid_stop_time"
    | "route_time_exceeded"
    | "minimum_visit_not_met"
    | "availability_unknown"
    | "outside_availability"
    | "age_incompatible"
    | "accessibility_not_confirmed"
    | "cost_unknown"
    | "budget_exceeded"
    | "required_stop_missing"
    | "travel_leg_missing"
    | "travel_leg_invalid"
    | "travel_time_conflict"
    | "travel_distance_exceeded";
  message: string;
  candidateId?: string;
  stopIndex?: number;
};

export type RouteValidationResult = {
  valid: boolean;
  errors: RouteValidationIssue[];
  warnings: RouteValidationIssue[];
  metrics: {
    stopCount: number;
    knownCostCents: number;
    unknownCostCount: number;
    routeDurationMinutes: number;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

function issue(
  code: RouteValidationIssue["code"],
  message: string,
  context: Pick<RouteValidationIssue, "candidateId" | "stopIndex"> = {},
): RouteValidationIssue {
  return { code, message, ...context };
}

function isFiniteMinute(value: number) {
  return Number.isInteger(value) && value >= 0;
}

export function validateGeneratedRoute(
  request: RouteValidationRequest,
  candidates: RouteCandidate[],
  stops: ProposedRouteStop[],
  travelLegs: ProposedTravelLeg[],
): RouteValidationResult {
  const errors: RouteValidationIssue[] = [];
  const warnings: RouteValidationIssue[] = [];
  const candidateById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const seen = new Set<string>();
  let knownCostCents = 0;
  let unknownCostCount = 0;

  stops.forEach((stop, stopIndex) => {
    const context = { candidateId: stop.candidateId, stopIndex };
    const candidate = candidateById.get(stop.candidateId);

    if (!candidate) {
      errors.push(
        issue(
          "candidate_not_supplied",
          `Stop ${stop.candidateId} was not supplied as an eligible candidate.`,
          context,
        ),
      );
      return;
    }

    if (seen.has(stop.candidateId)) {
      errors.push(
        issue(
          "duplicate_stop",
          `${candidate.name} appears more than once.`,
          context,
        ),
      );
    }
    seen.add(stop.candidateId);

    if (candidate.publicStatus !== "published" || !candidate.isActive) {
      errors.push(
        issue(
          "candidate_not_publishable",
          `${candidate.name} is not an active published record.`,
          context,
        ),
      );
    }

    if (candidate.verificationStatus !== "verified" || !candidate.verifiedAt) {
      errors.push(
        issue(
          "candidate_unverified",
          `${candidate.name} has not been verified.`,
          context,
        ),
      );
    } else {
      const ageDays =
        (request.now.getTime() - candidate.verifiedAt.getTime()) / DAY_MS;
      if (ageDays > request.maxVerificationAgeDays) {
        errors.push(
          issue(
            "candidate_stale",
            `${candidate.name} was verified too long ago.`,
            context,
          ),
        );
      }
    }

    if (
      !isFiniteMinute(stop.arrivalMinute) ||
      !isFiniteMinute(stop.departureMinute) ||
      stop.departureMinute <= stop.arrivalMinute
    ) {
      errors.push(
        issue(
          "invalid_stop_time",
          `${candidate.name} has an invalid arrival or departure time.`,
          context,
        ),
      );
      return;
    }

    if (
      stop.arrivalMinute < request.routeStartMinute ||
      stop.departureMinute > request.routeEndMinute
    ) {
      errors.push(
        issue(
          "route_time_exceeded",
          `${candidate.name} falls outside the requested route window.`,
          context,
        ),
      );
    }

    if (
      stop.departureMinute - stop.arrivalMinute <
      candidate.minimumVisitMinutes
    ) {
      errors.push(
        issue(
          "minimum_visit_not_met",
          `${candidate.name} needs at least ${candidate.minimumVisitMinutes} minutes.`,
          context,
        ),
      );
    }

    if (candidate.availability.length === 0) {
      errors.push(
        issue(
          "availability_unknown",
          `${candidate.name} has no verified availability window.`,
          context,
        ),
      );
    } else {
      const fitsWindow = candidate.availability.some(
        (window) =>
          stop.arrivalMinute >= window.startMinute &&
          stop.departureMinute <= window.endMinute,
      );
      if (!fitsWindow) {
        errors.push(
          issue(
            "outside_availability",
            `${candidate.name} is not available for the proposed visit.`,
            context,
          ),
        );
      }
    }

    if (
      candidate.minimumAge !== null &&
      request.youngestTravelerAge !== null &&
      request.youngestTravelerAge < candidate.minimumAge
    ) {
      errors.push(
        issue(
          "age_incompatible",
          `${candidate.name} requires guests to be ${candidate.minimumAge} or older.`,
          context,
        ),
      );
    }

    if (
      request.requiresAccessibleStops &&
      candidate.accessibility !== "confirmed"
    ) {
      errors.push(
        issue(
          "accessibility_not_confirmed",
          `${candidate.name} does not have confirmed accessibility data.`,
          context,
        ),
      );
    }

    if (candidate.costCents === null) {
      unknownCostCount += 1;
      warnings.push(
        issue(
          "cost_unknown",
          `${candidate.name} does not have a confirmed cost.`,
          context,
        ),
      );
    } else {
      knownCostCents += candidate.costCents;
    }
  });

  for (const requiredId of request.mustIncludeCandidateIds) {
    if (!seen.has(requiredId)) {
      errors.push(
        issue(
          "required_stop_missing",
          `Required stop ${requiredId} is missing from the route.`,
          { candidateId: requiredId },
        ),
      );
    }
  }

  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1]!;
    const current = stops[index]!;
    const leg = travelLegs.find(
      (candidateLeg) =>
        candidateLeg.fromCandidateId === previous.candidateId &&
        candidateLeg.toCandidateId === current.candidateId,
    );

    if (!leg) {
      errors.push(
        issue(
          "travel_leg_missing",
          `Travel data is missing between ${previous.candidateId} and ${current.candidateId}.`,
          { candidateId: current.candidateId, stopIndex: index },
        ),
      );
      continue;
    }

    if (
      !Number.isFinite(leg.durationMinutes) ||
      leg.durationMinutes < 0 ||
      !Number.isFinite(leg.distanceMiles) ||
      leg.distanceMiles < 0
    ) {
      errors.push(
        issue(
          "travel_leg_invalid",
          `Travel data is invalid before ${current.candidateId}.`,
          { candidateId: current.candidateId, stopIndex: index },
        ),
      );
      continue;
    }

    if (
      current.arrivalMinute <
      previous.departureMinute + leg.durationMinutes
    ) {
      errors.push(
        issue(
          "travel_time_conflict",
          `There is not enough travel time before ${current.candidateId}.`,
          { candidateId: current.candidateId, stopIndex: index },
        ),
      );
    }

    if (leg.distanceMiles > request.maxLegDistanceMiles) {
      errors.push(
        issue(
          "travel_distance_exceeded",
          `The trip to ${current.candidateId} exceeds the maximum leg distance.`,
          { candidateId: current.candidateId, stopIndex: index },
        ),
      );
    }
  }

  if (request.budgetCents !== null && knownCostCents > request.budgetCents) {
    errors.push(
      issue(
        "budget_exceeded",
        `Known route cost exceeds the budget by ${knownCostCents - request.budgetCents} cents.`,
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      stopCount: stops.length,
      knownCostCents,
      unknownCostCount,
      routeDurationMinutes: Math.max(
        0,
        request.routeEndMinute - request.routeStartMinute,
      ),
    },
  };
}
