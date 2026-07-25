import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadUserSettings, saveUserSettings } from "./user-settings";

// vitest runs in a node environment (no localStorage); stub a minimal one.
function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  });
  return store;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("loadUserSettings", () => {
  it("defaults to onboarding not done on first visit", () => {
    stubLocalStorage();
    expect(loadUserSettings()).toEqual({ onboarded: false });
  });

  it("round-trips saved settings", () => {
    stubLocalStorage();
    saveUserSettings({ onboarded: true });
    expect(loadUserSettings()).toEqual({ onboarded: true });
  });

  it("falls back to defaults on malformed JSON", () => {
    const store = stubLocalStorage();
    store.set("ruakh:user", "not json");
    expect(loadUserSettings()).toEqual({ onboarded: false });
  });

  it("falls back per-field when a saved value has the wrong type", () => {
    const store = stubLocalStorage();
    store.set("ruakh:user", JSON.stringify({ onboarded: "yes" }));
    expect(loadUserSettings()).toEqual({ onboarded: false });
  });

  it("returns defaults when localStorage is unavailable", () => {
    expect(loadUserSettings()).toEqual({ onboarded: false });
  });
});

describe("saveUserSettings", () => {
  it("does not throw when localStorage is unavailable", () => {
    expect(() => saveUserSettings({ onboarded: true })).not.toThrow();
  });
});
