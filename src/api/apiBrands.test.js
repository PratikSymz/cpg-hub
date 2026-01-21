import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/logo.png" } })),
    })),
  },
};

vi.mock("@/utils/supabase.js", () => ({
  default: vi.fn(() => mockSupabase),
}));

// Import after mocking
import {
  getAllBrands,
  getBrand,
  getMyBrandProfile,
  getMyBrands,
  addNewBrand,
  updateBrand,
  deleteBrand,
} from "./apiBrands.js";

describe("apiBrands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllBrands", () => {
    it("should fetch all brands", async () => {
      const mockBrands = [
        { id: "1", brand_name: "Brand 1" },
        { id: "2", brand_name: "Brand 2" },
      ];
      mockSupabase.select.mockResolvedValueOnce({ data: mockBrands, error: null });

      const result = await getAllBrands("token");

      expect(mockSupabase.from).toHaveBeenCalledWith("brand_profiles");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(result).toEqual(mockBrands);
    });

    it("should return null on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getAllBrands("token");

      expect(result).toBeNull();
    });
  });

  describe("getBrand", () => {
    it("should fetch a single brand by ID", async () => {
      const mockBrand = { id: "1", brand_name: "Test Brand" };
      mockSupabase.single.mockResolvedValueOnce({ data: mockBrand, error: null });

      const result = await getBrand("token", { brand_id: "1" });

      expect(mockSupabase.from).toHaveBeenCalledWith("brand_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "1");
      expect(result).toEqual(mockBrand);
    });

    it("should return null if brand not found", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      const result = await getBrand("token", { brand_id: "999" });

      expect(result).toBeNull();
    });
  });

  describe("getMyBrandProfile", () => {
    it("should fetch single brand profile for user", async () => {
      const mockProfile = {
        id: "1",
        brand_name: "My Brand",
        user_info: { user_id: "user_123", full_name: "Test User" },
      };
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });

      const result = await getMyBrandProfile("token", { user_id: "user_123" });

      expect(mockSupabase.from).toHaveBeenCalledWith("brand_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
      expect(result).toEqual(mockProfile);
    });

    it("should return null if no profile found", async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: "No profile" } });

      const result = await getMyBrandProfile("token", { user_id: "user_999" });

      expect(result).toBeNull();
    });
  });

  describe("getMyBrands", () => {
    it("should fetch all brands for a user", async () => {
      const mockBrands = [
        { id: "1", brand_name: "Brand 1", user_id: "user_123" },
        { id: "2", brand_name: "Brand 2", user_id: "user_123" },
      ];
      mockSupabase.order.mockResolvedValueOnce({ data: mockBrands, error: null });

      const result = await getMyBrands("token", { user_id: "user_123" });

      expect(mockSupabase.from).toHaveBeenCalledWith("brand_profiles");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual(mockBrands);
    });

    it("should return empty array if no brands found", async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: null, error: null });

      const result = await getMyBrands("token", { user_id: "user_999" });

      expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

      const result = await getMyBrands("token", { user_id: "user_123" });

      expect(result).toEqual([]);
    });
  });

  describe("addNewBrand", () => {
    const mockBrandData = {
      user_id: "user_123",
      brand_name: "New Brand",
      website: "https://newbrand.com",
      linkedin_url: "https://linkedin.com/company/newbrand",
      brand_hq: "New York",
      brand_desc: "A great brand",
      logo: [{ name: "logo.png", type: "image/png" }],
    };

    it("should create a new brand with logo", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: "new-brand-id", ...mockBrandData }],
        error: null,
      });

      const result = await addNewBrand("token", mockBrandData);

      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].brand_name).toBe("New Brand");
    });

    it("should create brand without logo", async () => {
      const dataWithoutLogo = { ...mockBrandData, logo: null };
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: "new-brand-id" }],
        error: null,
      });

      const result = await addNewBrand("token", dataWithoutLogo);

      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should throw error if insert fails", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: "Insert failed" },
      });

      await expect(addNewBrand("token", mockBrandData)).rejects.toThrow("Error submitting Brand");
    });
  });

  describe("updateBrand", () => {
    const mockBrandData = {
      brand_name: "Updated Brand",
      website: "https://updated.com",
      linkedin_url: "https://linkedin.com/company/updated",
      brand_hq: "Los Angeles",
      brand_desc: "Updated description",
      logo_url: "https://example.com/old-logo.png",
    };

    it("should update brand without new logo", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: "1", ...mockBrandData }],
        error: null,
      });

      const result = await updateBrand("token", mockBrandData, { user_id: "user_123" });

      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    });

    it("should update brand with new logo", async () => {
      const dataWithNewLogo = {
        ...mockBrandData,
        logo: [{ name: "new-logo.png", type: "image/png" }],
      };
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: "1" }],
        error: null,
      });

      const result = await updateBrand("token", dataWithNewLogo, { user_id: "user_123" });

      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should throw error if update fails", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(updateBrand("token", mockBrandData, { user_id: "user_123" })).rejects.toThrow();
    });
  });

  describe("deleteBrand", () => {
    it("should delete brand by user_id", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ id: "1", brand_name: "Deleted Brand" }],
        error: null,
      });

      const result = await deleteBrand("token", { user_id: "user_123" });

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user_123");
    });

    it("should return data even on error", async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: { message: "Delete failed" },
      });

      const result = await deleteBrand("token", { user_id: "user_123" });

      expect(result).toBeNull();
    });
  });
});
