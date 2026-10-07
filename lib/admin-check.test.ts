import { describe, expect, it } from "vitest";
import { isAdminUser } from "./admin-check";

const ADMIN = "admin@example.com";

describe("isAdminUser", () => {
  it("accepts the admin email (case-insensitive)", () => {
    expect(isAdminUser({ email: "admin@example.com" }, ADMIN)).toBe(true);
    expect(isAdminUser({ email: " Admin@Example.com " }, ADMIN)).toBe(true);
  });

  it("rejects other emails", () => {
    expect(isAdminUser({ email: "other@example.com" }, ADMIN)).toBe(false);
  });

  it("rejects anonymous users, even with a matching email", () => {
    expect(isAdminUser({ email: undefined, is_anonymous: true }, ADMIN)).toBe(false);
    expect(isAdminUser({ email: ADMIN, is_anonymous: true }, ADMIN)).toBe(false);
  });

  it("rejects users without an email", () => {
    expect(isAdminUser({}, ADMIN)).toBe(false);
    expect(isAdminUser({ email: null }, ADMIN)).toBe(false);
  });

  it("rejects everyone when the admin email is unset or blank", () => {
    expect(isAdminUser({}, undefined)).toBe(false);
    expect(isAdminUser({ email: "" }, "")).toBe(false);
    expect(isAdminUser({ email: "a@b.c" }, "  ")).toBe(false);
  });

  it("rejects when there is no user", () => {
    expect(isAdminUser(null, ADMIN)).toBe(false);
  });
});
