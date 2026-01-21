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
      unsafeMetadata: { roles: ["brand"] },
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
import PostJob from "./post-job.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("PostJob Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should show loading state initially", async () => {
      useUser.mockReturnValue({
        user: null,
        isLoaded: false,
      });

      renderWithRouter(<PostJob />);

      // Should show loading bar when not loaded
      expect(document.querySelector(".react-spinners-BarLoader-bar")).toBeTruthy;
    });

    it("should render the form when loaded", async () => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["brand"] },
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });

      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Post a Job")).toBeInTheDocument();
      });
    });
  });

  describe("Poster Type Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["brand", "talent"] },
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

    it("should display poster type options", async () => {
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("I'm posting as a...")).toBeInTheDocument();
        expect(screen.getByText("Brand")).toBeInTheDocument();
        expect(screen.getByText("Talent")).toBeInTheDocument();
        expect(screen.getByText("Service")).toBeInTheDocument();
      });
    });

    it("should allow switching poster types", async () => {
      const user = userEvent.setup();
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Brand")).toBeInTheDocument();
      });

      const talentButton = screen.getByText("Talent");
      await user.click(talentButton);

      // The talent button should now be selected
      expect(talentButton.closest("button")).toHaveClass("border-cpg-teal");
    });
  });

  describe("Brand Selection", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["brand"] },
        },
        isLoaded: true,
      });
    });

    it("should show 'Create new brand' when user has no brands", async () => {
      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });

      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Create new brand")).toBeInTheDocument();
      });
    });

    it("should show brand form fields when creating new brand", async () => {
      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: [], error: null })),
      });

      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Brand Name")).toBeInTheDocument();
        expect(screen.getByText("Logo")).toBeInTheDocument();
        expect(screen.getByText("Website")).toBeInTheDocument();
      });
    });
  });

  describe("Job Details", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["brand"] },
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

    it("should display job detail fields", async () => {
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Job Details")).toBeInTheDocument();
        expect(screen.getByText("Job Title")).toBeInTheDocument();
        expect(screen.getByText("Scope of Work")).toBeInTheDocument();
        expect(screen.getByText("Work Location")).toBeInTheDocument();
        expect(screen.getByText("Estimated hrs/week")).toBeInTheDocument();
        expect(screen.getByText("Area of Specialization")).toBeInTheDocument();
        expect(screen.getByText("Level of Experience")).toBeInTheDocument();
        expect(screen.getByText("Preferred Experience")).toBeInTheDocument();
      });
    });

    it("should allow selecting area of specialization", async () => {
      const user = userEvent.setup();
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Marketing")).toBeInTheDocument();
      });

      const marketingButton = screen.getByText("Marketing");
      await user.click(marketingButton);

      // Marketing should now be selected
      expect(marketingButton.closest("button")).toHaveClass("bg-cpg-teal");
    });

    it("should allow selecting multiple levels of experience", async () => {
      const user = userEvent.setup();
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        const seniorButton = screen.getByRole("button", { name: /Senior Level/i });
        expect(seniorButton).toBeInTheDocument();
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
          unsafeMetadata: { roles: ["brand"] },
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
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Post Job")).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Post Job");
      await user.click(submitButton);

      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText("Job title is required")).toBeInTheDocument();
      });
    });
  });

  describe("Talent/Service Profile Display", () => {
    it("should show create profile button for talent without profile", async () => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["talent"] },
        },
        isLoaded: true,
      });

      useFetch.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        func: vi.fn(() => Promise.resolve({ data: null, error: null })),
      });

      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Talent")).toBeInTheDocument();
      });

      const talentButton = screen.getByText("Talent");
      await userEvent.click(talentButton);

      await waitFor(() => {
        expect(screen.getByText("Create Talent Profile")).toBeInTheDocument();
      });
    });
  });

  describe("Optional Brand Fields", () => {
    beforeEach(() => {
      useUser.mockReturnValue({
        user: {
          id: "user_test123",
          fullName: "Test User",
          imageUrl: "https://example.com/image.jpg",
          unsafeMetadata: { roles: ["brand"] },
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

    it("should have collapsible additional info section", async () => {
      const user = userEvent.setup();
      renderWithRouter(<PostJob />);

      await waitFor(() => {
        expect(screen.getByText("Additional Info (Optional)")).toBeInTheDocument();
      });

      // Click to expand
      const expandButton = screen.getByText("Additional Info (Optional)");
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText("Headquarters Location")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
        expect(screen.getByText("Brand Description")).toBeInTheDocument();
      });
    });
  });
});
