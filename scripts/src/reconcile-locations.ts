import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type LocationRecord = {
  id?: string;
  slug?: string;
  name: string;
  address?: string;
  category?: string;
  neighborhood?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type ReconciliationIssue = {
  severity: "error" | "warning";
  code: string;
  legacyId?: string;
  canonicalId?: string;
  name: string;
  message: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function recordKey(record: LocationRecord): string {
  return normalize(record.slug || record.id || record.name);
}

export function reconcileLocations(
  legacy: LocationRecord[],
  canonical: LocationRecord[],
): ReconciliationIssue[] {
  const canonicalByKey = new Map(
    canonical.map((record) => [recordKey(record), record]),
  );
  const matchedCanonicalKeys = new Set<string>();
  const issues: ReconciliationIssue[] = [];

  for (const record of legacy) {
    const match =
      canonicalByKey.get(recordKey(record)) ??
      canonical.find(
        (candidate) =>
          normalize(candidate.name) === normalize(record.name) ||
          (candidate.address &&
            record.address &&
            normalize(candidate.address) === normalize(record.address)),
      );
    if (!match) {
      issues.push({
        severity: "error",
        code: "missing-canonical-record",
        legacyId: record.id,
        name: record.name,
        message: "Static location has no matching canonical database record.",
      });
      continue;
    }
    matchedCanonicalKeys.add(recordKey(match));

    const comparisons: Array<[keyof LocationRecord, string]> = [
      ["address", "address"],
      ["category", "category"],
      ["neighborhood", "area"],
    ];
    for (const [field, label] of comparisons) {
      if (
        record[field] &&
        match[field] &&
        normalize(String(record[field])) !== normalize(String(match[field]))
      ) {
        issues.push({
          severity: "warning",
          code: `${label}-mismatch`,
          legacyId: record.id,
          canonicalId: match.id,
          name: record.name,
          message: `Static ${label} differs from the canonical record.`,
        });
      }
    }

    if (
      record.latitude != null &&
      record.longitude != null &&
      (match.latitude == null || match.longitude == null)
    ) {
      issues.push({
        severity: "warning",
        code: "coordinates-not-migrated",
        legacyId: record.id,
        canonicalId: match.id,
        name: record.name,
        message:
          "Static coordinates exist but are missing from the canonical record.",
      });
    }
  }

  for (const record of canonical) {
    if (!matchedCanonicalKeys.has(recordKey(record))) {
      issues.push({
        severity: "warning",
        code: "canonical-only-record",
        canonicalId: record.id,
        name: record.name,
        message:
          "Canonical record has no matching static location; verify it should be public.",
      });
    }
  }

  return issues.sort(
    (a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code),
  );
}

function toMarkdown(
  legacyCount: number,
  canonicalCount: number,
  issues: ReconciliationIssue[],
): string {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  const matchedCount = legacyCount - errors;
  const coveragePercent =
    legacyCount === 0 ? 100 : Math.round((matchedCount / legacyCount) * 100);
  const canonicalOnlyCount = issues.filter(
    (issue) => issue.code === "canonical-only-record",
  ).length;
  const rolloutReady = errors === 0 && warnings === 0;
  const rows = issues.length
    ? issues
        .map(
          (issue) =>
            `| ${issue.severity} | ${issue.code} | ${issue.name.replace(/\|/g, "\\|")} | ${issue.message} |`,
        )
        .join("\n")
    : "| — | — | — | No reconciliation issues found. |";

  return `# Location reconciliation report

- Static records: ${legacyCount}
- Canonical records: ${canonicalCount}
- Matched static records: ${matchedCount}
- Static coverage: ${coveragePercent}%
- Canonical-only records: ${canonicalOnlyCount}
- Errors: ${errors}
- Warnings: ${warnings}
- Canonical rollout ready: ${rolloutReady ? "Yes" : "No"}

| Severity | Code | Location | Finding |
| --- | --- | --- | --- |
${rows}
`;
}

async function readRecords(filePath: string): Promise<LocationRecord[]> {
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(parsed))
    throw new Error(`${filePath} must contain a JSON array.`);
  return parsed as LocationRecord[];
}

async function main(): Promise<void> {
  const [
    legacyPath,
    canonicalPath,
    outputPath = "exports/location-reconciliation.md",
  ] = process.argv.slice(2);
  if (!legacyPath || !canonicalPath) {
    throw new Error(
      "Usage: pnpm --filter @workspace/scripts reconcile:locations <static.json> <canonical.json> [report.md]",
    );
  }

  const legacy = await readRecords(path.resolve(legacyPath));
  const canonical = await readRecords(path.resolve(canonicalPath));
  const issues = reconcileLocations(legacy, canonical);
  const resolvedOutput = path.resolve(outputPath);
  await writeFile(
    resolvedOutput,
    toMarkdown(legacy.length, canonical.length, issues),
    "utf8",
  );
  process.stdout.write(
    `Wrote ${issues.length} findings to ${resolvedOutput}\n`,
  );
}

if (process.argv[1]?.endsWith("reconcile-locations.ts")) {
  void main();
}
