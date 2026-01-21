import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

// Mock dependencies
vi.mock("@clerk/clerk-react", () => ({
  useUser: vi.fn(() => ({
    user: {
      id: "user_test123",
      fullName: "Test User",
      imageUrl: "https://example.com/image.jpg",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      unsafeMetadata: { roles: [] },
      update: vi.fn(() => Promise.resolve()),
    },
    isLoaded: true,
  })),
  useSession: vi.fn(() => ({
    session: {
      getToken: vi.fn(() => Promise.resolve("mock-token")),
    },
  })),
}));

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

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Import after mocking
import TalentOnboarding from "./talent-onboarding.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("TalentOnboarding Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should show loading state when user not loaded", async () => {
      useUser.mockReturnValue({
        user: null,
        isLoaded: false,
      });

      renderWithRouter(<TalentOnboarding />);

      expect(document.querySelector(".react-spinners-BarLoader-bar")).toBeTruthy;
    });

    it("should render the form when loaded", async () => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });

      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Your Talent Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Profile Card Display", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should display user profile information", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      });
    });

    it("should display user profile image", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        const profileImage = screen.getByAltText("Profile");
        expect(profileImage).toBeInTheDocument();
        expect(profileImage).toHaveAttribute("src", "https://example.com/image.jpg");
      });
    });
  });

  describe("Form Fields", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should display all required form fields", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Industry Experience")).toBeInTheDocument();
        expect(screen.getByText("Area of Specialization")).toBeInTheDocument();
        expect(screen.getByText("Level of Experience")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
        expect(screen.getByText("Website URL")).toBeInTheDocument();
        expect(screen.getByText("Upload Resume")).toBeInTheDocument();
      });
    });

    it("should display specialization options", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Marketing")).toBeInTheDocument();
        expect(screen.getByText("Sales")).toBeInTheDocument();
        expect(screen.getByText("Operations")).toBeInTheDocument();
        expect(screen.getByText("Finance")).toBeInTheDocument();
      });
    });

    it("should display experience level options", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Senior Level/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Executive Level/i })).toBeInTheDocument();
      });
    });
  });

  describe("Area of Specialization Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should allow selecting specialization areas", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Marketing")).toBeInTheDocument();
      });

      const marketingButton = screen.getByText("Marketing");
      await user.click(marketingButton);

      // Marketing should now be selected (has bg-cpg-teal)
      expect(marketingButton.closest("button")).toHaveClass("bg-cpg-teal");
    });

    it("should allow deselecting specialization areas", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Marketing")).toBeInTheDocument();
      });

      const marketingButton = screen.getByText("Marketing");

      // Select
      await user.click(marketingButton);
      expect(marketingButton.closest("button")).toHaveClass("bg-cpg-teal");

      // Deselect
      await user.click(marketingButton);
      expect(marketingButton.closest("button")).not.toHaveClass("bg-cpg-teal");
    });

    it("should show Other input when Other is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

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

  describe("Level of Experience Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should allow selecting experience levels", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        const seniorButton = screen.getByRole("button", { name: /Senior Level/i });
        expect(seniorButton).toBeInTheDocument();
      });

      const seniorButton = screen.getByRole("button", { name: /Senior Level/i });
      await user.click(seniorButton);

      // Should be selected (has bg-cpg-brown)
      expect(seniorButton).toHaveClass("bg-cpg-brown");
    });

    it("should allow selecting multiple experience levels", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Senior Level/i })).toBeInTheDocument();
      });

      const seniorButton = screen.getByRole("button", { name: /Senior Level/i });
      const executiveButton = screen.getByRole("button", { name: /Executive Level/i });

      await user.click(seniorButton);
      await user.click(executiveButton);

      expect(seniorButton).toHaveClass("bg-cpg-brown");
      expect(executiveButton).toHaveClass("bg-cpg-brown");
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should show validation errors on empty submit", async () => {
      const user = userEvent.setup();
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Profile")).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Profile");
      await user.click(submitButton);

      await waitFor(() => {
        // Should show validation errors for required fields
        expect(screen.getByText(/industry experience is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("Submit Button", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should display submit button", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Profile")).toBeInTheDocument();
      });
    });

    it("should have correct styling for submit button", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        const submitButton = screen.getByText("Create Profile").closest("button");
        expect(submitButton).toHaveClass("bg-cpg-brown");
        expect(submitButton).toHaveClass("rounded-xl");
      });
    });
  });

  describe("Brand Experience Note", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          emailAddresses: [{ emailAddress: "test@example.com" }],
          unsafeMetadata: { roles: [] },
          update: vi.fn(),
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });
    });

    it("should display brand experience note", async () => {
      renderWithRouter(<TalentOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Brands I've Worked With")).toBeInTheDocument();
        expect(screen.getByText(/Add your basic profile info first/i)).toBeInTheDocument();
      });
    });
  });
});
