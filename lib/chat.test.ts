import { describe, expect, it } from "vitest";
import { chatErrorMessage, mergeMessages, type ChatMessage } from "./chat";

const msg = (id: number, created_at: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  region: "yangon",
  township: null,
  group_tag: "A",
  kind: "power_on",
  nickname: "ဧည့်သည်",
  body: "",
  author: "u1",
  created_at,
  ...over,
});

describe("mergeMessages", () => {
  it("dedupes by id and sorts oldest first", () => {
    const a = msg(2, "2026-10-07T10:02:00Z");
    const b = msg(1, "2026-10-07T10:01:00Z");
    const out = mergeMessages([a], [b, a]);
    expect(out.map((m) => m.id)).toEqual([1, 2]);
  });

  it("lets incoming data replace an existing row", () => {
    const out = mergeMessages([msg(1, "2026-10-07T10:00:00Z")], [msg(1, "2026-10-07T10:00:00Z", { nickname: "Ko" })]);
    expect(out).toHaveLength(1);
    expect(out[0].nickname).toBe("Ko");
  });

  it("keeps only the latest 300", () => {
    const many = Array.from({ length: 350 }, (_, i) =>
      msg(i + 1, new Date(Date.UTC(2026, 9, 7, 0, 0, i)).toISOString()),
    );
    const out = mergeMessages([], many);
    expect(out).toHaveLength(300);
    expect(out[0].id).toBe(51);
  });
});

describe("chatErrorMessage", () => {
  it("maps trigger errors to Burmese", () => {
    expect(chatErrorMessage("RATE_LIMIT")).toBe("ခဏစောင့်ပါ");
    expect(chatErrorMessage("NO_LINKS")).toBe("Link မထည့်ရပါ");
  });
  it("falls back to a generic message", () => {
    expect(chatErrorMessage("boom")).toContain("ပို့၍ မရပါ");
    expect(chatErrorMessage(undefined)).toContain("ပို့၍ မရပါ");
  });
});
