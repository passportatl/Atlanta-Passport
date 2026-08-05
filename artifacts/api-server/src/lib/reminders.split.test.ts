import { describe, expect, it } from "vitest";
import { splitDigestGroups } from "./reminders";
import { staffEmailFor } from "./staff-directory";
import { NOTIFY_EMAIL } from "./mailer";
import type { CrmRecordOut } from "../routes/crm";

const rec = (name: string, assignedTo: string | null): CrmRecordOut => ({
  recordType: "event",
  id: name,
  name,
  contactName: null,
  contactEmail: null,
  packageId: null,
  listingPrice: null,
  addOns: null,
  workflowStatus: null,
  salesStage: "contacted",
  assignedTo,
  lastContactAt: null,
  nextFollowUpAt: "2026-07-29T10:00:00.000Z",
  crmNotes: null,
  paymentStatus: "unpaid",
  createdAt: "2026-07-01T00:00:00.000Z",
});

const directory = [
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
];

describe("staffEmailFor", () => {
  it("matches names case- and whitespace-insensitively", () => {
    expect(staffEmailFor(directory, "  alice ")).toBe("alice@example.com");
    expect(staffEmailFor(directory, "BOB")).toBe("bob@example.com");
  });
  it("returns null for unmapped or missing assignees", () => {
    expect(staffEmailFor(directory, "Carol")).toBeNull();
    expect(staffEmailFor(directory, null)).toBeNull();
    expect(staffEmailFor(directory, "  ")).toBeNull();
  });
});

describe("splitDigestGroups", () => {
  it("splits per mapped assignee and routes the rest to the shared inbox", () => {
    const overdue = [rec("o1", "Alice"), rec("o2", "Carol"), rec("o3", null)];
    const dueToday = [rec("d1", "bob"), rec("d2", "Alice")];
    const groups = splitDigestGroups(directory, overdue, dueToday);

    expect(groups.map((g) => g.to)).toEqual([
      NOTIFY_EMAIL,
      "alice@example.com",
      "bob@example.com",
    ]);
    const shared = groups[0]!;
    expect(shared.overdue.map((r) => r.id)).toEqual(["o2", "o3"]);
    expect(shared.dueToday).toHaveLength(0);
    const alice = groups[1]!;
    expect(alice.overdue.map((r) => r.id)).toEqual(["o1"]);
    expect(alice.dueToday.map((r) => r.id)).toEqual(["d2"]);
    const bob = groups[2]!;
    expect(bob.dueToday.map((r) => r.id)).toEqual(["d1"]);
  });

  it("with an empty directory everything goes to the shared inbox", () => {
    const groups = splitDigestGroups([], [rec("o1", "Alice")], [rec("d1", null)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.to).toBe(NOTIFY_EMAIL);
    expect(groups[0]!.overdue).toHaveLength(1);
    expect(groups[0]!.dueToday).toHaveLength(1);
  });
});
