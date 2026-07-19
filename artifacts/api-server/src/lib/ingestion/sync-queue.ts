// Centralized sync queue — Sprint 4.
//
// All syncs (manual + scheduled) flow through this queue:
//   • at most one queued-or-running job per source (no duplicate jobs)
//   • bounded concurrency with staggered starts
//   • per-job timeout protection
//   • cancellation of queued jobs
//   • every job persisted to sync_jobs for the admin dashboard
//
// The executor is in-process; sync_jobs rows are the durable record. On
// startup any rows left "queued"/"running" by a previous process are marked
// cancelled/failed so the history never shows phantom jobs.

import { eq, inArray } from "drizzle-orm";
import { db, syncJobsTable, importRunsTable } from "@workspace/db";
import { runSourceSync } from "./runner";
import { notifyAdmin } from "./health";
import { logger } from "../logger";

const MAX_CONCURRENT = 2;
const STAGGER_MS = 2_000; // gap between job starts
const JOB_TIMEOUT_MS = 10 * 60 * 1000; // hard cap per job

type QueuedJob = {
  jobId: string;
  sourceId: string;
  sourceName: string;
  priority: number; // 1 = highest
  queuedAt: number;
  cancelled: boolean;
  resolve: (result: JobResult) => void;
};

export type JobResult = {
  jobId: string;
  status: "success" | "warning" | "failed" | "cancelled";
  runId: string | null;
  result: string | null;
  errorMessage: string | null;
};

const queue: QueuedJob[] = [];
const activeSourceIds = new Set<string>(); // sources with a queued or running job
let runningCount = 0;
let lastStartAt = 0;

export function getQueueSnapshot() {
  return {
    queued: queue.length,
    running: runningCount,
    maxConcurrent: MAX_CONCURRENT,
  };
}

// ── Startup recovery ──────────────────────────────────────────────────────────

export async function recoverStaleJobs(): Promise<void> {
  try {
    const stale = await db
      .select({ id: syncJobsTable.id, status: syncJobsTable.status })
      .from(syncJobsTable)
      .where(inArray(syncJobsTable.status, ["queued", "running"]));
    if (stale.length === 0) return;
    const now = new Date();
    for (const job of stale) {
      await db
        .update(syncJobsTable)
        .set({
          status: job.status === "running" ? "failed" : "cancelled",
          completedAt: now,
          errorMessage: "Server restarted before the job finished",
        })
        .where(eq(syncJobsTable.id, job.id));
    }
    logger.warn({ count: stale.length }, "Recovered stale sync jobs from previous process");
  } catch (err) {
    logger.error({ err }, "Failed to recover stale sync jobs");
  }
}

// ── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueSync(opts: {
  sourceId: string;
  sourceName: string;
  trigger: "manual" | "scheduled" | "retry";
  priority?: number;
}): Promise<{ jobId: string; promise: Promise<JobResult> } | { alreadyQueued: true }> {
  if (activeSourceIds.has(opts.sourceId)) {
    return { alreadyQueued: true };
  }
  activeSourceIds.add(opts.sourceId);

  const priority = opts.priority ?? (opts.trigger === "manual" ? 1 : 5);
  let jobId: string;
  try {
    const [row] = await db
      .insert(syncJobsTable)
      .values({ sourceId: opts.sourceId, trigger: opts.trigger, priority, status: "queued" })
      .returning({ id: syncJobsTable.id });
    jobId = row!.id;
  } catch (err) {
    // Roll back the in-memory lock or the source stays stuck as "alreadyQueued".
    activeSourceIds.delete(opts.sourceId);
    throw err;
  }

  let resolve!: (r: JobResult) => void;
  const promise = new Promise<JobResult>((r) => (resolve = r));

  queue.push({
    jobId,
    sourceId: opts.sourceId,
    sourceName: opts.sourceName,
    priority,
    queuedAt: Date.now(),
    cancelled: false,
    resolve,
  });
  queue.sort((a, b) => a.priority - b.priority || a.queuedAt - b.queuedAt);

  void pump();
  return { jobId, promise };
}

// ── Cancellation (queued jobs only) ──────────────────────────────────────────

export async function cancelJob(jobId: string): Promise<"cancelled" | "not_found" | "running"> {
  const idx = queue.findIndex((j) => j.jobId === jobId);
  if (idx === -1) {
    const [row] = await db
      .select({ status: syncJobsTable.status })
      .from(syncJobsTable)
      .where(eq(syncJobsTable.id, jobId));
    if (!row) return "not_found";
    return row.status === "running" ? "running" : "not_found";
  }
  const [job] = queue.splice(idx, 1);
  job!.cancelled = true;
  activeSourceIds.delete(job!.sourceId);
  await db
    .update(syncJobsTable)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(eq(syncJobsTable.id, jobId));
  job!.resolve({ jobId, status: "cancelled", runId: null, result: null, errorMessage: null });
  return "cancelled";
}

// ── Executor ──────────────────────────────────────────────────────────────────

async function pump(): Promise<void> {
  while (runningCount < MAX_CONCURRENT && queue.length > 0) {
    // Staggered starts: never launch two jobs in the same instant.
    const wait = lastStartAt + STAGGER_MS - Date.now();
    if (wait > 0) {
      setTimeout(() => void pump(), wait);
      return;
    }
    const job = queue.shift()!;
    if (job.cancelled) continue;
    runningCount++;
    lastStartAt = Date.now();
    void executeJob(job).finally(() => {
      runningCount--;
      void pump();
    });
  }
}

async function executeJob(job: QueuedJob): Promise<void> {
  const startedAt = new Date();
  await db
    .update(syncJobsTable)
    .set({ status: "running", startedAt })
    .where(eq(syncJobsTable.id, job.jobId));

  let result: JobResult;
  // Kicked off once; referenced by both the race and the lock-release logic
  // below so a timed-out-but-still-running sync keeps its source locked.
  const runPromise = runSourceSync(job.sourceId);
  let timedOut = false;
  let timer: NodeJS.Timeout | undefined;
  try {
    const runId = await Promise.race([
      runPromise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          timedOut = true;
          reject(new Error(`Sync job timed out after ${JOB_TIMEOUT_MS / 60000} minutes`));
        }, JOB_TIMEOUT_MS);
      }),
    ]);
    // Pull the run summary to decide success vs warning.
    const [run] = await db
      .select({ status: importRunsTable.status, inserted: importRunsTable.inserted, duplicates: importRunsTable.duplicates, changed: importRunsTable.changed, errors: importRunsTable.errors })
      .from(importRunsTable)
      .where(eq(importRunsTable.id, runId));
    const summary = run
      ? `${run.inserted} inserted, ${run.duplicates} duplicates, ${run.changed} seen, ${run.errors} errors`
      : null;
    const status: JobResult["status"] =
      run?.status === "error" ? "failed" : run?.status === "partial" ? "warning" : "success";
    result = { jobId: job.jobId, status, runId, result: summary, errorMessage: run?.status === "error" ? summary : null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = { jobId: job.jobId, status: "failed", runId: null, result: null, errorMessage: msg };
    logger.error({ jobId: job.jobId, sourceId: job.sourceId, err }, "Sync job failed");
  } finally {
    if (timer) clearTimeout(timer);
    if (timedOut) {
      // runSourceSync can't be aborted mid-flight, so keep the per-source lock
      // (and prevent a concurrent overlapping run) until it actually settles.
      void runPromise
        .catch(() => {})
        .finally(() => {
          activeSourceIds.delete(job.sourceId);
          logger.warn({ jobId: job.jobId, sourceId: job.sourceId }, "Timed-out sync finally settled; source lock released");
        });
    } else {
      activeSourceIds.delete(job.sourceId);
    }
  }

  const completedAt = new Date();
  await db
    .update(syncJobsTable)
    .set({
      status: result.status,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      runId: result.runId,
      result: result.result,
      errorMessage: result.errorMessage,
    })
    .where(eq(syncJobsTable.id, job.jobId))
    .catch((err) => logger.error({ jobId: job.jobId, err }, "Failed to finalize sync job row"));

  if (result.status === "failed" && result.errorMessage?.includes("timed out")) {
    await notifyAdmin({
      type: "scheduler_failure",
      severity: "critical",
      title: `${job.sourceName}: sync job timed out`,
      body: result.errorMessage,
      sourceId: job.sourceId,
    });
  }

  job.resolve(result);
}
