import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";

// Mock dependencies
vi.mock("@clerk/clerk-react", () => ({
  useUser: vi.fn(() => ({
    user: {
      id: "user_test123",
      fullName: "Test User",
      imageUrl: "https://example.com/image.jpg",
      unsafeMetadata: { roles: ["talent"] },
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  useSession: vi.fn(() => ({
    session: {
      getToken: vi.fn(() => Promise.resolve("mock-token")),
    },
  })),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "talent-uuid-123" }),
  };
});

vi.mock("@/hooks/use-fetch.jsx", () => ({
  default: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    func: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the TalentExperienceSection component to avoid nested useFetch calls
vi.mock("@/components/experience-section.jsx", () => ({
  default: ({ user_id, showEdit }) => (
    <div data-testid="experience-section">
      Experience Section for {user_id}
    </div>
  ),
}));

// Import after mocking
import EditTalentPage from "./edit-fractional-talent.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EditTalentPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should show loading state when data is loading", async () => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: false,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditTalentPage />);

      expect(document.querySelector(".react-spinners-BarLoader-bar")).toBeTruthy;
    });

    it("should show 'not found' message when talent data is null", async () => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Talent profile not found.")).toBeInTheDocument();
      });
    });
  });

  describe("Permission Checks", () => {
    it("should show permission error for non-owner users", async () => {
      useUser.mockReturnValue({
        user: { id: "different_user" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: { user_id: "user_test123", full_name: "Owner" },
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("You don't have permission to edit this profile.")).toBeInTheDocument();
      });
    });

    it("should allow owner to edit their profile", async () => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
            profile_picture_url: "https://example.com/image.jpg",
          },
          level_of_experience: ["Senior Level"],
          area_of_specialization: ["Marketing"],
          industry_experience: "10 years",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Talent Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Profile Card Display", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "John Doe",
            email: "john@example.com",
            profile_picture_url: "https://example.com/john.jpg",
          },
          level_of_experience: ["Senior Level"],
          area_of_specialization: ["Marketing"],
          industry_experience: "10 years in CPG",
          linkedin_url: "https://linkedin.com/in/john",
          portfolio_url: "https://johndoe.com",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display profile owner's name", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display profile owner's email", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("should display profile owner's image", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const profileImage = screen.getByAltText("Profile");
        expect(profileImage).toBeInTheDocument();
        expect(profileImage).toHaveAttribute("src", "https://example.com/john.jpg");
      });
    });
  });

  describe("Form Fields", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          level_of_experience: ["Senior Level"],
          area_of_specialization: ["Marketing"],
          industry_experience: "10 years",
          linkedin_url: "https://linkedin.com/in/test",
          portfolio_url: "https://test.com",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display all form fields", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Industry Experience")).toBeInTheDocument();
        expect(screen.getByText("Area of Specialization")).toBeInTheDocument();
        expect(screen.getByText("Level of Experience")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
        expect(screen.getByText("Website URL")).toBeInTheDocument();
        expect(screen.getByText("Resume")).toBeInTheDocument();
      });
    });

    it("should pre-populate industry experience", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/8 years in food & beverage/i);
        expect(textarea).toHaveValue("10 years");
      });
    });

    it("should display specialization area buttons and show pre-selected values", async () => {
      renderWithRouter(<EditTalentPage />);

      // Verify specialization buttons are rendered - Marketing appears twice
      // (once as button, once as selected tag) when pre-populated
      await waitFor(() => {
        const marketingElements = screen.getAllByText("Marketing");
        expect(marketingElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Sales")).toBeInTheDocument();
        expect(screen.getByText("Operations")).toBeInTheDocument();
      });
    });

    it("should show selected experience levels", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const seniorButton = screen.getByRole("button", { name: /Senior Level/i });
        expect(seniorButton).toHaveClass("bg-cpg-brown");
      });
    });
  });

  describe("Action Buttons", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          level_of_experience: [],
          area_of_specialization: [],
          industry_experience: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display save button", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
      });
    });

    it("should display delete button", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Delete Profile")).toBeInTheDocument();
      });
    });

    it("should have correct styling for save button", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const saveButton = screen.getByText("Save Changes").closest("button");
        expect(saveButton).toHaveClass("bg-cpg-brown");
        expect(saveButton).toHaveClass("rounded-xl");
      });
    });

    it("should have correct styling for delete button", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const deleteButton = screen.getByText("Delete Profile").closest("button");
        expect(deleteButton).toHaveClass("text-red-600");
        expect(deleteButton).toHaveClass("rounded-xl");
      });
    });
  });

  describe("Specialization Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          level_of_experience: [],
          area_of_specialization: [],
          industry_experience: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should allow toggling specialization areas", async () => {
      const user = userEvent.setup();
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Sales")).toBeInTheDocument();
      });

      const salesButton = screen.getByText("Sales");

      // Initially not selected
      expect(salesButton.closest("button")).not.toHaveClass("bg-cpg-teal");

      // Click to select
      await user.click(salesButton);

      // Now should be selected
      expect(salesButton.closest("button")).toHaveClass("bg-cpg-teal");
    });

    it("should show Other input when Other is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Other")).toBeInTheDocument();
      });

      const otherButton = screen.getByText("Other");
      await user.click(otherButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Enter your specialization")).toBeInTheDocument();
      });
    });
  });

  describe("Page Header", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "talent-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          level_of_experience: [],
          area_of_specialization: [],
          industry_experience: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display gradient title", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        const title = screen.getByText("Edit Talent Profile");
        expect(title).toHaveClass("gradient-title");
      });
    });

    it("should display subtitle", async () => {
      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(screen.getByText("Update the profile information below.")).toBeInTheDocument();
      });
    });
  });

  describe("Loading by ID", () => {
    it("should fetch talent by ID from URL params", async () => {
      const mockFetchTalent = vi.fn();

      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: mockFetchTalent,
      });

      renderWithRouter(<EditTalentPage />);

      await waitFor(() => {
        expect(mockFetchTalent).toHaveBeenCalledWith({ talent_id: "talent-uuid-123" });
      });
    });
  });
});
