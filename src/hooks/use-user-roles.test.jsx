import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { getUserRoles, useUserRoles, addRole } from "./use-user-roles.jsx";

vi.mock("@clerk/clerk-react", () => ({
  useUser: vi.fn(),
}));

import { useUser } from "@clerk/clerk-react";

describe("getUserRoles", () => {
  it("returns the roles array when present", () => {
    expect(getUserRoles({ unsafeMetadata: { roles: ["brand", "talent"] } })).toEqual([
      "brand",
      "talent",
    ]);
  });

  it("returns empty array when roles is missing", () => {
    expect(getUserRoles({ unsafeMetadata: {} })).toEqual([]);
  });

  it("returns empty array when user is null", () => {
    expect(getUserRoles(null)).toEqual([]);
  });

  it("returns empty array when roles is not an array", () => {
    expect(getUserRoles({ unsafeMetadata: { roles: "brand" } })).toEqual([]);
  });
});

describe("useUserRoles", () => {
  it("reads roles from Clerk user", () => {
    useUser.mockReturnValue({ user: { unsafeMetadata: { roles: ["service"] } } });
    const { result } = renderHook(() => useUserRoles());
    expect(result.current).toEqual(["service"]);
  });

  it("returns empty array when signed out", () => {
    useUser.mockReturnValue({ user: null });
    const { result } = renderHook(() => useUserRoles());
    expect(result.current).toEqual([]);
  });
});

describe("addRole", () => {
  it("no-ops when the role is already present", async () => {
    const update = vi.fn();
    const user = { unsafeMetadata: { roles: ["brand"] }, update };
    const result = await addRole(user, "brand");
    expect(result).toEqual(["brand"]);
    expect(update).not.toHaveBeenCalled();
  });

  it("appends a missing role and calls user.update", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const user = { unsafeMetadata: { roles: ["brand"] }, update };
    const result = await addRole(user, "talent");
    expect(result).toEqual(["brand", "talent"]);
    expect(update).toHaveBeenCalledWith({
      unsafeMetadata: { roles: ["brand", "talent"] },
    });
  });

  it("starts a fresh roles array when none exists", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const user = { unsafeMetadata: {}, update };
    const result = await addRole(user, "brand");
    expect(result).toEqual(["brand"]);
    expect(update).toHaveBeenCalledWith({
      unsafeMetadata: { roles: ["brand"] },
    });
  });
});
