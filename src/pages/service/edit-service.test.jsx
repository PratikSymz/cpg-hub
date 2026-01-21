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
      unsafeMetadata: { roles: ["service"] },
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
    useParams: () => ({ id: "service-uuid-123" }),
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

// Import after mocking
import EditServicePage from "./edit-service.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("EditServicePage Component", () => {
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

      renderWithRouter(<EditServicePage />);

      expect(document.querySelector(".react-spinners-BarLoader-bar")).toBeTruthy;
    });

    it("should show 'not found' message when service data is null", async () => {
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

      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Service profile not found.")).toBeInTheDocument();
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
          id: "service-uuid-123",
          user_info: { user_id: "user_test123", full_name: "Owner" },
          company_name: "Test Company",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditServicePage />);

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
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
            profile_picture_url: "https://example.com/image.jpg",
          },
          company_name: "Test Company",
          category_of_service: ["Broker"],
          area_of_specialization: "Supply Chain",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });

      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Service Profile")).toBeInTheDocument();
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
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "John Doe",
            email: "john@example.com",
            profile_picture_url: "https://example.com/john.jpg",
          },
          company_name: "Test Services Inc",
          category_of_service: ["Broker"],
          area_of_specialization: "Logistics",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display profile owner's name", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display profile owner's email", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("should display profile owner's image", async () => {
      renderWithRouter(<EditServicePage />);

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
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          company_name: "Test Company",
          company_website: "https://test.com",
          category_of_service: ["Broker"],
          type_of_broker_service: ["Retail"],
          markets_covered: ["Northeast"],
          area_of_specialization: "Supply Chain",
          customers_covered: "CPG Brands",
          num_employees: 10,
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display all form fields", async () => {
      renderWithRouter(<EditServicePage />);

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

    it("should pre-populate company name", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Finback Services");
        expect(input).toHaveValue("Test Company");
      });
    });

    it("should display category buttons", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Category of Service")).toBeInTheDocument();
      });

      // Check that category buttons exist
      const brokerButtons = screen.getAllByRole("button", { name: /Broker/i });
      expect(brokerButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("should show broker services when Broker is selected", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Type of Broker Service")).toBeInTheDocument();
      });
    });

    it("should show markets covered when applicable category is selected", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Markets Covered")).toBeInTheDocument();
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
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          company_name: "Test Company",
          category_of_service: [],
          area_of_specialization: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display save button", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
      });
    });

    it("should display delete button", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Delete Profile")).toBeInTheDocument();
      });
    });

    it("should have correct styling for save button", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        const saveButton = screen.getByText("Save Changes").closest("button");
        expect(saveButton).toHaveClass("bg-cpg-brown");
        expect(saveButton).toHaveClass("rounded-xl");
      });
    });

    it("should have correct styling for delete button", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        const deleteButton = screen.getByText("Delete Profile").closest("button");
        expect(deleteButton).toHaveClass("text-red-600");
        expect(deleteButton).toHaveClass("rounded-xl");
      });
    });
  });

  describe("Category Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: {
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          company_name: "Test Company",
          category_of_service: [],
          area_of_specialization: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should allow toggling category selection", async () => {
      const user = userEvent.setup();
      renderWithRouter(<EditServicePage />);

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
          id: "service-uuid-123",
          user_info: {
            user_id: "user_test123",
            full_name: "Test User",
            email: "test@example.com",
          },
          company_name: "Test Company",
          category_of_service: [],
          area_of_specialization: "",
        },
        loading: false,
        error: null,
        func: vi.fn(),
      });
    });

    it("should display gradient title", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        const title = screen.getByText("Edit Service Profile");
        expect(title).toHaveClass("gradient-title");
      });
    });

    it("should display subtitle", async () => {
      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(screen.getByText("Update your service provider information below.")).toBeInTheDocument();
      });
    });
  });

  describe("Loading by ID", () => {
    it("should fetch service by ID from URL params", async () => {
      const mockFetchService = vi.fn();

      useUser.mockReturnValue({
        user: { id: "user_test123" },
        isLoaded: true,
        isSignedIn: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: mockFetchService,
      });

      renderWithRouter(<EditServicePage />);

      await waitFor(() => {
        expect(mockFetchService).toHaveBeenCalledWith({ broker_id: "service-uuid-123" });
      });
    });
  });
});
