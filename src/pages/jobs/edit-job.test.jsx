import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-job-123" }),
  };
});

// Mock data
const mockJobData = {
  id: "test-job-123",
  brand_id: "brand-456",
  job_title: "Marketing Director",
  preferred_experience: "5+ years experience",
  level_of_experience: ["Senior Level", "Executive Level"],
  work_location: "Remote",
  scope_of_work: "Ongoing",
  area_of_specialization: ["Marketing", "Sales"],
  estimated_hrs_per_wk: 20,
  is_open: true,
  job_description: "https://example.com/job-desc.pdf",
  poster_id: "user_123",
  poster_name: "Test Brand",
  poster_logo: "https://example.com/logo.png",
  poster_location: "New York, NY",
};

const mockBrandData = {
  id: "brand-456",
  brand_name: "Test Brand",
  website: "https://testbrand.com",
  linkedin_url: "https://linkedin.com/company/testbrand",
  brand_hq: "New York, NY",
  brand_desc: "A leading CPG brand",
  logo_url: "https://example.com/logo.png",
  user_id: "user_123",
};

// Track mock calls
let mockFetchJob = vi.fn();
let mockFetchBrand = vi.fn();
let mockSaveBrand = vi.fn();
let mockSaveJob = vi.fn();
let mockRemoveJob = vi.fn();
let jobDataToReturn = mockJobData;
let brandDataToReturn = mockBrandData;
let isJobLoading = false;
let isBrandLoading = false;
let isSavingBrand = false;
let isSavingJob = false;
let isDeletingJob = false;

// Mock useFetch
vi.mock("@/hooks/use-fetch.jsx", () => ({
  default: vi.fn((apiFunc) => {
    const funcName = apiFunc?.name || "";
    if (funcName.includes("getSingleJob")) {
      return { loading: isJobLoading, data: jobDataToReturn, error: null, func: mockFetchJob };
    }
    if (funcName.includes("getBrand")) {
      return { loading: isBrandLoading, data: brandDataToReturn, error: null, func: mockFetchBrand };
    }
    if (funcName.includes("updateBrandById")) {
      return { loading: isSavingBrand, error: null, func: mockSaveBrand };
    }
    if (funcName.includes("updateJob")) {
      return { loading: isSavingJob, error: null, func: mockSaveJob };
    }
    if (funcName.includes("deleteJob")) {
      return { loading: isDeletingJob, func: mockRemoveJob };
    }
    return { loading: false, data: null, error: null, func: vi.fn() };
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import EditJobPage from "./edit-job.jsx";
import { toast } from "sonner";

const renderPage = () => render(<BrowserRouter><EditJobPage /></BrowserRouter>);

describe("EditJobPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobDataToReturn = mockJobData;
    brandDataToReturn = mockBrandData;
    isJobLoading = false;
    isBrandLoading = false;
    isSavingBrand = false;
    isSavingJob = false;
    isDeletingJob = false;
    mockSaveBrand.mockResolvedValue({ data: mockBrandData, error: null });
    mockSaveJob.mockResolvedValue({ data: mockJobData, error: null });
    mockRemoveJob.mockResolvedValue({ data: mockJobData, error: null });
  });

  describe("Loading States", () => {
    it("shows loading when job is loading", () => {
      isJobLoading = true;
      renderPage();
      expect(screen.queryByText("Edit Job")).not.toBeInTheDocument();
    });

    it("shows loading when brand is loading", () => {
      isBrandLoading = true;
      renderPage();
      expect(screen.queryByText("Edit Job")).not.toBeInTheDocument();
    });
  });

  describe("Job Not Found", () => {
    it("shows not found message when job is null", () => {
      jobDataToReturn = null;
      renderPage();
      expect(screen.getByText("Job Not Found")).toBeInTheDocument();
      expect(screen.getByText("Back to Jobs")).toBeInTheDocument();
    });

    it("navigates to jobs on back button click", async () => {
      jobDataToReturn = null;
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Back to Jobs"));
      expect(mockNavigate).toHaveBeenCalledWith("/jobs");
    });
  });

  describe("Page Header", () => {
    it("displays title and subtitle", () => {
      renderPage();
      expect(screen.getByText("Edit Job")).toBeInTheDocument();
      expect(screen.getByText(/Update brand information and job details/i)).toBeInTheDocument();
    });
  });

  describe("Job Status Banner", () => {
    it("shows open status for open jobs", () => {
      renderPage();
      expect(screen.getByText("Job is Open")).toBeInTheDocument();
      expect(screen.getByText("Close Job")).toBeInTheDocument();
    });

    it("shows closed status for closed jobs", () => {
      jobDataToReturn = { ...mockJobData, is_open: false };
      renderPage();
      expect(screen.getByText("Job is Closed")).toBeInTheDocument();
      expect(screen.getByText("Reopen Job")).toBeInTheDocument();
    });

    it("calls toggle API when button clicked", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Close Job"));
      expect(mockSaveJob).toHaveBeenCalledWith({
        jobData: { is_open: false },
        job_id: "test-job-123",
      });
    });
  });

  describe("Tab Navigation", () => {
    it("displays both tabs", () => {
      renderPage();
      // Use getAllByText and check for tab buttons specifically
      const brandTabs = screen.getAllByText("Brand Information");
      const jobTabs = screen.getAllByText("Job Details");
      expect(brandTabs.length).toBeGreaterThan(0);
      expect(jobTabs.length).toBeGreaterThan(0);
    });

    it("brand tab active by default", () => {
      renderPage();
      // Find the tab button specifically (has rounded-xl class)
      const brandTabs = screen.getAllByText("Brand Information");
      const tabButton = brandTabs.find(el => el.classList.contains("rounded-xl"));
      expect(tabButton).toHaveClass("bg-cpg-teal");
    });

    it("switches to job tab on click", async () => {
      const user = userEvent.setup();
      renderPage();
      // Find tab buttons by role
      const tabButtons = screen.getAllByRole("button");
      const jobTabButton = tabButtons.find(btn => btn.textContent === "Job Details" && btn.classList.contains("rounded-xl"));
      await user.click(jobTabButton);
      expect(jobTabButton).toHaveClass("bg-cpg-teal");
    });
  });

  describe("Brand Tab Form", () => {
    it("displays brand form fields", () => {
      renderPage();
      expect(screen.getByText("Brand Logo")).toBeInTheDocument();
      expect(screen.getByText("Brand Name")).toBeInTheDocument();
      expect(screen.getByText("Website")).toBeInTheDocument();
      expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
    });

    it("populates with existing brand data", () => {
      renderPage();
      expect(screen.getByPlaceholderText("e.g. Acme Corp")).toHaveValue("Test Brand");
      expect(screen.getByPlaceholderText("https://yourcompany.com")).toHaveValue("https://testbrand.com");
    });

    it("shows sync message", () => {
      renderPage();
      expect(screen.getByText(/Changes will sync to all jobs under this brand/i)).toBeInTheDocument();
    });

    it("shows logo preview", () => {
      renderPage();
      expect(screen.getByAltText("Logo preview")).toHaveAttribute("src", mockBrandData.logo_url);
    });
  });

  describe("Brand Form Validation", () => {
    it("shows error when brand name empty", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.clear(screen.getByPlaceholderText("e.g. Acme Corp"));
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(screen.getByText("Brand name is required")).toBeInTheDocument();
      });
    });

    it("validates URL format", async () => {
      const user = userEvent.setup();
      renderPage();
      const websiteInput = screen.getByPlaceholderText("https://yourcompany.com");
      await user.clear(websiteInput);
      await user.type(websiteInput, "not-valid");
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
      });
    });
  });

  describe("Brand Save", () => {
    it("calls saveBrand with correct data", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(mockSaveBrand).toHaveBeenCalledWith({
          brand_id: "brand-456",
          brandData: expect.objectContaining({ brand_name: "Test Brand" }),
          newLogo: null,
        });
      });
    });

    it("shows success toast", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Brand updated"));
      });
    });
  });

  describe("Job Tab Form", () => {
    it("displays job form fields", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      expect(screen.getByText("Job Title")).toBeInTheDocument();
      expect(screen.getByText("Scope of Work")).toBeInTheDocument();
      expect(screen.getByText("Work Location")).toBeInTheDocument();
      expect(screen.getByText("Hours/Week")).toBeInTheDocument();
    });

    it("shows job description PDF link", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      expect(screen.getByText("Job Description PDF")).toBeInTheDocument();
      expect(screen.getByText("View PDF")).toBeInTheDocument();
    });

    it("populates with existing job data", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      expect(screen.getByPlaceholderText("e.g. Marketing Director")).toHaveValue("Marketing Director");
    });
  });

  describe("Job Form Validation", () => {
    it("shows error when job title empty", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.clear(screen.getByPlaceholderText("e.g. Marketing Director"));
      await user.click(screen.getByText("Save Job Changes"));
      await waitFor(() => {
        expect(screen.getByText("Job title is required")).toBeInTheDocument();
      });
    });
  });

  describe("Job Save", () => {
    it("calls saveJob with correct data", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByText("Save Job Changes"));
      await waitFor(() => {
        expect(mockSaveJob).toHaveBeenCalledWith({
          jobData: expect.objectContaining({ job_title: "Marketing Director" }),
          job_id: "test-job-123",
        });
      });
    });

    it("navigates to job detail on success", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByText("Save Job Changes"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/job/test-job-123", { replace: true });
      });
    });

    it("shows success toast", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByText("Save Job Changes"));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Job updated successfully!");
      });
    });
  });

  describe("Delete Job", () => {
    it("shows danger zone", () => {
      renderPage();
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("Delete Job")).toBeInTheDocument();
    });

    it("shows confirmation on delete click", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      expect(screen.getByText("Yes, Delete Permanently")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("hides confirmation on cancel", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      await user.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Yes, Delete Permanently")).not.toBeInTheDocument();
    });

    it("calls delete API on confirm", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      await user.click(screen.getByText("Yes, Delete Permanently"));
      expect(mockRemoveJob).toHaveBeenCalledWith({ job_id: "test-job-123" });
    });

    it("navigates to jobs after delete", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      await user.click(screen.getByText("Yes, Delete Permanently"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/jobs", { replace: true });
      });
    });

    it("shows success toast after delete", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      await user.click(screen.getByText("Yes, Delete Permanently"));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Job deleted successfully!");
      });
    });
  });

  describe("Specialization Selection", () => {
    it("allows toggling specializations", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      const financeButton = screen.getByRole("button", { name: "Finance" });
      await user.click(financeButton);
      expect(financeButton).toHaveClass("bg-cpg-teal");
    });

    it("shows Other input when clicked", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByRole("button", { name: "Other" }));
      expect(screen.getByPlaceholderText("Enter specialization")).toBeInTheDocument();
    });

    it("adds custom specialization", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByRole("button", { name: "Other" }));
      await user.type(screen.getByPlaceholderText("Enter specialization"), "Custom Spec");
      await user.click(screen.getByRole("button", { name: "Add" }));
      expect(screen.getByText("Custom Spec")).toBeInTheDocument();
    });
  });

  describe("Level of Experience", () => {
    it("displays all options", async () => {
      const user = userEvent.setup();
      renderPage();
      // Find and click the Job Details tab button
      const tabButtons = screen.getAllByRole("button");
      const jobTabButton = tabButtons.find(btn => btn.textContent === "Job Details" && btn.classList.contains("rounded-xl"));
      await user.click(jobTabButton);
      expect(screen.getByRole("button", { name: "Entry Level" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mid-Level" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Senior Level" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Executive Level" })).toBeInTheDocument();
    });

    it("pre-selects existing levels", async () => {
      const user = userEvent.setup();
      renderPage();
      // Find and click the Job Details tab button
      const tabButtons = screen.getAllByRole("button");
      const jobTabButton = tabButtons.find(btn => btn.textContent === "Job Details" && btn.classList.contains("rounded-xl"));
      await user.click(jobTabButton);
      // Find buttons with exact text that have the selected class
      const allButtons = screen.getAllByRole("button");
      const seniorButton = allButtons.find(btn => btn.textContent === "Senior Level" && btn.classList.contains("bg-cpg-teal"));
      const executiveButton = allButtons.find(btn => btn.textContent === "Executive Level" && btn.classList.contains("bg-cpg-teal"));
      expect(seniorButton).toBeTruthy();
      expect(executiveButton).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("shows error toast when brand save fails", async () => {
      mockSaveBrand.mockRejectedValue(new Error("Failed"));
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update brand.");
      });
    });

    it("shows error toast when job save fails", async () => {
      mockSaveJob.mockResolvedValue({ error: { message: "Failed" } });
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      await user.click(screen.getByText("Save Job Changes"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update job.");
      });
    });

    it("shows error toast when delete fails", async () => {
      mockRemoveJob.mockRejectedValue(new Error("Failed"));
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Delete Job"));
      await user.click(screen.getByText("Yes, Delete Permanently"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete job.");
      });
    });
  });

  describe("Save Button States", () => {
    it("shows loading text when saving brand", () => {
      isSavingBrand = true;
      renderPage();
      expect(screen.getByText("Saving Brand...")).toBeInTheDocument();
    });

    it("shows loading text when saving job", async () => {
      isSavingJob = true;
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByText("Job Details"));
      expect(screen.getByText("Saving Job...")).toBeInTheDocument();
    });
  });

  describe("No Brand Linked", () => {
    it("shows error when saving brand with no brand_id", async () => {
      jobDataToReturn = { ...mockJobData, brand_id: null };
      brandDataToReturn = null;
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByPlaceholderText("e.g. Acme Corp"), "Test");
      await user.click(screen.getByText("Save Brand Changes"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No brand linked to this job");
      });
    });
  });
});
