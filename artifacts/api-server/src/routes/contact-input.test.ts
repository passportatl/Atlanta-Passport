import { describe, expect, it } from "vitest";
import { SubmitContactMessageBody } from "@workspace/api-zod";

const contactReasons = [
  "general_question",
  "technical_support",
  "media_press",
  "partnership",
  "event_listing",
  "location_listing",
  "sponsorship",
  "billing",
  "other",
] as const;

describe("contact message input", () => {
  it.each(contactReasons)("accepts the %s contact reason", (topic) => {
    const parsed = SubmitContactMessageBody.safeParse({
      name: "Passport Partner",
      email: "partner@example.com",
      topic,
      message: "Please send this message to the appropriate team.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a contact reason outside the approved list", () => {
    const parsed = SubmitContactMessageBody.safeParse({
      name: "Passport Partner",
      email: "partner@example.com",
      topic: "uncategorized",
      message: "Please send this message to the appropriate team.",
    });

    expect(parsed.success).toBe(false);
  });
});
