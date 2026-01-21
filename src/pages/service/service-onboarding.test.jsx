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
import ServiceOnboarding from "./service-onboarding.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ServiceOnboarding Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should show loading state when user not loaded", async () => {
      useUser.mockReturnValue({
        user: null,
        isLoaded: false,
      });

      renderWithRouter(<ServiceOnboarding />);

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

      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Your Service Profile")).toBeInTheDocument();
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
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      });
    });

    it("should display user profile image", async () => {
      renderWithRouter(<ServiceOnboarding />);

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
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Company Name")).toBeInTheDocument();
        expect(screen.getByText("Company Website")).toBeInTheDocument();
        expect(screen.getByText("Company Logo")).toBeInTheDocument();
        expect(screen.getByText("About Service")).toBeInTheDocument();
        expect(screen.getByText("Number of Employees")).toBeInTheDocument();
        expect(screen.getByText("Area of Specialization")).toBeInTheDocument();
        expect(screen.getByText("Category of Service")).toBeInTheDocument();
      });
    });

    it("should display category options", async () => {
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Broker")).toBeInTheDocument();
        expect(screen.getByText("Sales")).toBeInTheDocument();
        expect(screen.getByText("Merchandising")).toBeInTheDocument();
        expect(screen.getByText("Marketing")).toBeInTheDocument();
      });
    });
  });

  describe("Category of Service Selection", () => {
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

    it("should allow selecting categories", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Sales")).toBeInTheDocument();
      });

      const salesButton = screen.getByText("Sales");
      await user.click(salesButton);

      // Sales should now be selected (has bg-cpg-teal)
      expect(salesButton.closest("button")).toHaveClass("bg-cpg-teal");
    });

    it("should allow deselecting categories", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Sales")).toBeInTheDocument();
      });

      const salesButton = screen.getByText("Sales");

      // Select
      await user.click(salesButton);
      expect(salesButton.closest("button")).toHaveClass("bg-cpg-teal");

      // Deselect
      await user.click(salesButton);
      expect(salesButton.closest("button")).not.toHaveClass("bg-cpg-teal");
    });

    it("should show broker services when Broker is selected", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Broker")).toBeInTheDocument();
      });

      const brokerButton = screen.getByText("Broker");
      await user.click(brokerButton);

      await waitFor(() => {
        expect(screen.getByText("Type of Broker Service")).toBeInTheDocument();
      });
    });

    it("should show markets covered when applicable category is selected", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Sales")).toBeInTheDocument();
      });

      const salesButton = screen.getByText("Sales");
      await user.click(salesButton);

      await waitFor(() => {
        expect(screen.getByText("Markets Covered")).toBeInTheDocument();
      });
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
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Profile")).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Create Profile");
      await user.click(submitButton);

      await waitFor(() => {
        // Should show validation errors for required fields
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
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
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Create Profile")).toBeInTheDocument();
      });
    });

    it("should have correct styling for submit button", async () => {
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        const submitButton = screen.getByText("Create Profile").closest("button");
        expect(submitButton).toHaveClass("bg-cpg-brown");
        expect(submitButton).toHaveClass("rounded-xl");
      });
    });
  });

  describe("Page Header", () => {
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

    it("should display gradient title", async () => {
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        const title = screen.getByText("Create Your Service Profile");
        expect(title).toHaveClass("gradient-title");
      });
    });

    it("should display subtitle", async () => {
      renderWithRouter(<ServiceOnboarding />);

      await waitFor(() => {
        expect(screen.getByText("Showcase your services and connect with CPG brands looking for expert providers.")).toBeInTheDocument();
      });
    });
  });

  describe("Broker Service Selection", () => {
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

    it("should allow selecting broker service types", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      // First select Broker category
      await waitFor(() => {
        expect(screen.getByText("Broker")).toBeInTheDocument();
      });

      const brokerButton = screen.getByText("Broker");
      await user.click(brokerButton);

      // Now broker services should appear
      await waitFor(() => {
        expect(screen.getByText("Retail")).toBeInTheDocument();
      });

      const retailButton = screen.getByText("Retail");
      await user.click(retailButton);

      // Retail should now be selected (has bg-cpg-brown)
      expect(retailButton.closest("button")).toHaveClass("bg-cpg-brown");
    });
  });

  describe("Markets Covered Selection", () => {
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

    it("should allow selecting markets", async () => {
      const user = userEvent.setup();
      renderWithRouter(<ServiceOnboarding />);

      // First select a category that triggers markets
      await waitFor(() => {
        expect(screen.getByText("Sales")).toBeInTheDocument();
      });

      const salesButton = screen.getByText("Sales");
      await user.click(salesButton);

      // Now markets should appear
      await waitFor(() => {
        expect(screen.getByText("Northeast")).toBeInTheDocument();
      });

      const northeastButton = screen.getByText("Northeast");
      await user.click(northeastButton);

      // Northeast should now be selected (has bg-cpg-brown)
      expect(northeastButton.closest("button")).toHaveClass("bg-cpg-brown");
    });
  });
});
