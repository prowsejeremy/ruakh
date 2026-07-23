import { describe, expect, it } from "vitest";
import { adminGateDecision, safeTokenEqual } from "./admin-gate";

const TOKEN = "k3x9w-Zt7qP2mR8vL4nY6sB1dF5gH0jC";

describe("adminGateDecision", () => {
  it("is disabled when no token is configured", () => {
    expect(
      adminGateDecision({
        configuredToken: undefined,
        queryToken: null,
        cookieToken: undefined,
      }),
    ).toBe("disabled");
  });

  it("is disabled when the configured token is empty", () => {
    expect(
      adminGateDecision({
        configuredToken: "",
        queryToken: "anything",
        cookieToken: "anything",
      }),
    ).toBe("disabled");
  });

  it("grants (sets the door cookie) on a matching query token", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: TOKEN,
        cookieToken: undefined,
      }),
    ).toBe("grant");
  });

  it("grants on a matching query token even when the cookie is already valid, so the cookie is refreshed", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: TOKEN,
        cookieToken: TOKEN,
      }),
    ).toBe("grant");
  });

  it("passes on a matching door cookie with no query token", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: null,
        cookieToken: TOKEN,
      }),
    ).toBe("pass");
  });

  it("passes on a valid cookie even when a stale query token mismatches", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: "rotated-away-old-token",
        cookieToken: TOKEN,
      }),
    ).toBe("pass");
  });

  it("denies when neither query token nor cookie match", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: "wrong",
        cookieToken: "also-wrong",
      }),
    ).toBe("deny");
  });

  it("denies when nothing is presented at all", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: null,
        cookieToken: undefined,
      }),
    ).toBe("deny");
  });

  it("denies an empty query token rather than treating it as a match", () => {
    expect(
      adminGateDecision({
        configuredToken: TOKEN,
        queryToken: "",
        cookieToken: undefined,
      }),
    ).toBe("deny");
  });
});

describe("safeTokenEqual", () => {
  it("matches identical strings", () => {
    expect(safeTokenEqual(TOKEN, TOKEN)).toBe(true);
  });

  it("rejects different strings without throwing on length mismatch", () => {
    expect(safeTokenEqual(TOKEN, "short")).toBe(false);
    expect(safeTokenEqual("", TOKEN)).toBe(false);
  });
});
