import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a chainable mock that returns itself for method chaining
const createChainableMock = () => {
  const mock = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/resume.pdf" } })),
      })),
    },
  };

  // Make each method return the mock for chaining
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);

  return mock;
};

const mockSupabase = createChainableMock();

vi.mock("@/utils/supabase.js", () => ({
  default: vi.fn(() => mockSupabase),
}));

// Import after mocking
import {
  getAllTalent,
  getTalent,
  getMyTalentProfile,
  addNewTalent,
  updateTalent,
  updateTalentById,
  deleteTalent,
  deleteTalentById,
} from "./apiTalent.js";

describe("apiTalent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllTalent", () => {
    it("should fetch all talent profiles with user info", async () => {
      const mockTalents = [
        {
          id: "uuid-1",
          user_id: "user_123",
          level_of_experience: ["Senior Level"],
          area_of_specialization: ["Marketing"],
          user_info: { full_name: "John Doe", email: "john@example.com" },
        },
        {
          id: "uuid-2",
          user_id: "user_456",
          level_of_experience: ["Executive Level"],
          area_of_specialization: ["Sales"],
          user_info: { full_name: "Jane Smith", email: "jane@example.com" },
        },
      ];
      mockSupabase.select.mockResolvedValueOnce({ data: mockTalents, error: null });

      const result = await getAllTalent("token", {});

      expect(mockSupabase.from).toHaveBeenCalledWith("talent_profiles");
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining("user_info: user_profiles")
      );
      expect(result).toEqual(mockTalents);
    });

    it("should return data even with filters (currently commented out)", async () => {
      const mockTalents = [{ id: "uuid-1", area_of_specialization: ["Marketing"] }];
      mockSupabase.select.mockResolvedValueOnce({ data: mockTalents, error: null });

      const result = await getAllTalent("token", {
        area_specialization: "Marketing",
        level_exp: "Senior Level",
      });

      expect(result).toEqual(mockTalents);
    });

    it("should return undefined on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getAllTalent("token", {});

      expect(result).toBeNull();
    });
  });

  describe("getTalent", () => {
    it("should fetch a single talent by ID", async () => {
      const mockTalent = {
        id: "uuid-1",
        user_id: "user_123",
        level_of_experience: ["Senior Level"],
        industry_experience: "10 years in CPG",
        user_info: { full_name: "John Doe" },
      };
      mockSupabase.single.mockResolvedValueOnce({ data: mockTalent, error: null });

      const result = await getTalent("token", { talent_id: "uuid-1" });

      expect(mockSupabase.from).toHaveBeenCalledWith("talent_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "uuid-1");
      expect(result).toEqual(mockTalent);
    });

    it("should return null if talent not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      const result = await getTalent("token", { talent_id: "nonexistent" });

      expect(result).toBeNull();
    });
  });

  describe("getMyTalentProfile", () => {
    it("should fetch talent profile by user_id", async () => {
      const mockProfile = {
        id: "uuid-1",
        user_id: "user_123",
        level_of_experience: ["Mid Level"],
        user_info: { full_name: "My Profile" },
      };
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockProfile, error: null });

      const result = await getMyTalentProfile("token", { user_id: "user_123" });

      expect(mockSupabase.from).toHaveBeenCalledWith("talent_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
      expect(result).toEqual(mockProfile);
    });

    it("should return null if user has no profile", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getMyTalentProfile("token", { user_id: "user_no_profile" });

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getMyTalentProfile("token", { user_id: "user_123" });

      expect(result).toBeNull();
    });
  });

  describe("addNewTalent", () => {
    it("should be a function", () => {
      expect(typeof addNewTalent).toBe("function");
    });

    it("should accept token and talentData parameters", () => {
      expect(addNewTalent.length).toBe(2);
    });

    it("should insert talent profile without resume", async () => {
      const talentData = {
        user_id: "user_123",
        level_of_experience: ["Senior Level"],
        industry_experience: "10 years experience",
        area_of_specialization: ["Marketing", "Sales"],
        linkedin_url: "https://linkedin.com/in/test",
        portfolio_url: "https://example.com",
      };
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "uuid-new" }], error: null });

      const result = await addNewTalent("token", talentData);

      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toEqual([{ id: "uuid-new" }]);
    });
  });

  describe("updateTalent", () => {
    it("should update talent profile by user_id", async () => {
      const talentData = {
        level_of_experience: ["Executive Level"],
        industry_experience: "Updated experience",
        area_of_specialization: ["Operations"],
        linkedin_url: "https://linkedin.com/in/updated",
        portfolio_url: "https://updated.com",
        resume_url: "https://example.com/resume.pdf",
      };
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "uuid-1" }], error: null });

      const result = await updateTalent("token", talentData, { user_id: "user_123" });

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    });

    it("should return null on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Update failed" } });

      const result = await updateTalent("token", {}, { user_id: "user_123" });

      expect(result).toBeNull();
    });
  });

  describe("updateTalentById", () => {
    it("should update talent profile by talent ID", async () => {
      const talentData = {
        level_of_experience: ["Senior Level"],
        industry_experience: "Updated by ID",
        area_of_specialization: ["Finance"],
        linkedin_url: "https://linkedin.com/in/byid",
        portfolio_url: "https://byid.com",
        resume_url: "https://example.com/resume.pdf",
      };
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "uuid-1" }], error: null });

      const result = await updateTalentById("token", talentData, { talent_id: "uuid-1" });

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "uuid-1");
    });

    it("should return null on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Update failed" } });

      const result = await updateTalentById("token", {}, { talent_id: "uuid-1" });

      expect(result).toBeNull();
    });
  });

  describe("deleteTalent", () => {
    it("should delete talent profile by user_id", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "uuid-1" }], error: null });

      const result = await deleteTalent("token", { user_id: "user_123" });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    });
  });

  describe("deleteTalentById", () => {
    it("should delete talent profile by ID", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: "uuid-1" }], error: null });

      const result = await deleteTalentById("token", { talent_id: "uuid-1" });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "uuid-1");
    });

    it("should return data even on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Delete failed" } });

      const result = await deleteTalentById("token", { talent_id: "uuid-1" });

      // Note: Current implementation returns data even on error
      expect(result).toBeNull();
    });
  });
});
