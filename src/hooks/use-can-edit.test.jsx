import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCanEdit } from "./use-can-edit.jsx";

vi.mock("@clerk/clerk-react", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/constants/admins.js", () => ({
  isAdminEmail: vi.fn((email) => email === "admin@example.com"),
}));

import { useUser } from "@clerk/clerk-react";

const signedIn = (id, email = "user@example.com") => ({
  isSignedIn: true,
  user: { id, primaryEmailAddress: { emailAddress: email } },
});

describe("useCanEdit", () => {
  it("returns isOwner and canEdit when user owns the resource", () => {
    useUser.mockReturnValue(signedIn("u_1"));
    const { result } = renderHook(() => useCanEdit("u_1"));
    expect(result.current).toEqual({ isOwner: true, isAdmin: false, canEdit: true });
  });

  it("grants canEdit to admins but not isOwner", () => {
    useUser.mockReturnValue(signedIn("u_2", "admin@example.com"));
    const { result } = renderHook(() => useCanEdit("u_1"));
    expect(result.current).toEqual({ isOwner: false, isAdmin: true, canEdit: true });
  });

  it("denies edit when the user is neither owner nor admin", () => {
    useUser.mockReturnValue(signedIn("u_2"));
    const { result } = renderHook(() => useCanEdit("u_1"));
    expect(result.current).toEqual({ isOwner: false, isAdmin: false, canEdit: false });
  });

  it("denies edit when signed out", () => {
    useUser.mockReturnValue({ isSignedIn: false, user: null });
    const { result } = renderHook(() => useCanEdit("u_1"));
    expect(result.current).toEqual({ isOwner: false, isAdmin: false, canEdit: false });
  });

  it("denies edit when resourceUserId is missing", () => {
    useUser.mockReturnValue(signedIn("u_1"));
    const { result } = renderHook(() => useCanEdit(undefined));
    expect(result.current.isOwner).toBe(false);
  });
});
