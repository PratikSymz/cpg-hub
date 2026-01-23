import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarLoader } from "react-spinners";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { deleteJob, getSingleJob, updateJob } from "@/api/apiFractionalJobs.js";
import { getBrand, updateBrandById } from "@/api/apiBrands.js";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import clsx from "clsx";
import { z } from "zod";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import {
  classLabel,
  classInput,
  classTextArea,
} from "@/constants/classnames.js";
import { toast } from "sonner";
import NumberInput from "@/components/number-input.jsx";
import DiscardChangesGuard from "@/components/discard-changes-guard.js";
import BackButton from "@/components/back-button.jsx";
import {
  X,
  Building2,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

// Schema for brand editing
const BrandSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required"),
  website: z.string().url("Please enter a valid URL").or(z.literal("")),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")),
  brand_hq: z.string().optional(),
  brand_desc: z.string().optional(),
});

// Schema for job editing
const JobSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  preferred_experience: z.string().min(1, "Preferred experience is required"),
  level_of_experience: z.array(z.string()).min(1, "Select at least one level"),
  work_location: z.string().min(1, "Work location is required"),
  scope_of_work: z.string().min(1, "Scope of work is required"),
  area_of_specialization: z.array(z.string()).min(1, "Select at least one area"),
  estimated_hrs_per_wk: z.coerce.number().min(1, "Hours per week is required"),
});

const EditJobPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const submittedRef = useRef(false);

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [posterLogoPreview, setPosterLogoPreview] = useState("");
  const [newPosterLogoFile, setNewPosterLogoFile] = useState(null);
  const [posterName, setPosterName] = useState("");
  const [posterLocation, setPosterLocation] = useState("");
  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("job"); // Default to job tab

  // Load job data
  const {
    loading: loadingJob,
    data: jobData,
    func: fetchJob,
  } = useFetch(getSingleJob);

  // Load brand data
  const {
    loading: loadingBrand,
    data: brandData,
    func: fetchBrand,
  } = useFetch(getBrand);

  // Update brand
  const {
    loading: savingBrand,
    error: saveBrandError,
    func: saveBrand,
  } = useFetch(updateBrandById);

  // Update job
  const {
    loading: savingJob,
    error: saveJobError,
    func: saveJob,
  } = useFetch(updateJob);

  // Delete job
  const {
    loading: deletingJob,
    func: removeJob,
  } = useFetch(deleteJob);

  // Brand form
  const brandForm = useForm({
    defaultValues: {
      brand_name: "",
      website: "",
      linkedin_url: "",
      brand_hq: "",
      brand_desc: "",
    },
    resolver: zodResolver(BrandSchema),
  });

  // Job form
  const jobForm = useForm({
    defaultValues: {
      job_title: "",
      preferred_experience: "",
      level_of_experience: [],
      work_location: "Remote",
      scope_of_work: "Ongoing",
      area_of_specialization: [],
      estimated_hrs_per_wk: "",
    },
    resolver: zodResolver(JobSchema),
  });

  const brandErrors = brandForm.formState.errors;
  const jobErrors = jobForm.formState.errors;
  const isDirty = brandForm.formState.isDirty || jobForm.formState.isDirty;

  // Fetch job on mount
  useEffect(() => {
    if (id) {
      fetchJob({ job_id: id });
    }
  }, [id]);

  // Fetch brand when job data loads
  useEffect(() => {
    if (jobData?.brand_id) {
      fetchBrand({ brand_id: jobData.brand_id });
    }
  }, [jobData?.brand_id]);

  // Populate brand form when brand data loads
  useEffect(() => {
    if (brandData) {
      brandForm.reset({
        brand_name: brandData.brand_name || "",
        website: brandData.website || "",
        linkedin_url: brandData.linkedin_url || "",
        brand_hq: brandData.brand_hq || "",
        brand_desc: brandData.brand_desc || "",
      });
      if (brandData.logo_url) setLogoPreview(brandData.logo_url);
    }
  }, [brandData]);

  // Populate job form when job data loads
  useEffect(() => {
    if (jobData) {
      jobForm.reset({
        job_title: jobData.job_title || "",
        preferred_experience: jobData.preferred_experience || "",
        level_of_experience: jobData.level_of_experience || [],
        work_location: jobData.work_location || "Remote",
        scope_of_work: jobData.scope_of_work || "Ongoing",
        area_of_specialization: jobData.area_of_specialization || [],
        estimated_hrs_per_wk: jobData.estimated_hrs_per_wk || "",
      });
      // For brandless jobs, populate poster info
      if (!jobData.brand_id) {
        setPosterName(jobData.poster_name || "");
        setPosterLocation(jobData.poster_location || "");
        if (jobData.poster_logo) setPosterLogoPreview(jobData.poster_logo);
      }
    }
  }, [jobData]);

  // Navigation guards
  const handleBackClick = () => {
    if (isDirty) {
      setShowDialog(true);
      setNavTarget(-1);
    } else {
      navigate(-1);
    }
  };

  const handleDiscard = () => {
    setShowDialog(false);
    if (navTarget !== null) {
      navigate(navTarget);
      setNavTarget(null);
    }
  };

  const handleStay = () => {
    setShowDialog(false);
    setNavTarget(null);
  };

  // Logo handling (for brand)
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Poster logo handling (for brandless jobs)
  const handlePosterLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPosterLogoFile(file);
      setPosterLogoPreview(URL.createObjectURL(file));
    }
  };

  // Save poster info (for brandless jobs)
  const handleSavePoster = async () => {
    try {
      await saveJob({
        jobData: {
          poster_name: posterName,
          poster_location: posterLocation,
        },
        job_id: id,
        newLogo: newPosterLogoFile,
      });
      toast.success("Poster information updated!");
      setNewPosterLogoFile(null);
      fetchJob({ job_id: id });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update poster information.");
    }
  };

  // Save brand
  const handleSaveBrand = async (data) => {
    if (!jobData?.brand_id) {
      toast.error("No brand linked to this job");
      return;
    }

    try {
      await saveBrand({
        brand_id: jobData.brand_id,
        brandData: {
          ...data,
          logo_url: brandData?.logo_url,
        },
        newLogo: newLogoFile,
      });
      toast.success("Brand updated! Changes synced to all jobs under this brand.");
      setNewLogoFile(null);
      // Refresh data
      fetchBrand({ brand_id: jobData.brand_id });
      fetchJob({ job_id: id });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update brand.");
    }
  };

  // Save job
  const handleSaveJob = async (data) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      const result = await saveJob({
        jobData: {
          job_title: data.job_title,
          preferred_experience: data.preferred_experience,
          level_of_experience: data.level_of_experience,
          work_location: data.work_location,
          scope_of_work: data.scope_of_work,
          area_of_specialization: data.area_of_specialization,
          estimated_hrs_per_wk: data.estimated_hrs_per_wk,
        },
        job_id: id,
      });

      if (result?.error) {
        throw new Error(result.error.message || "Failed to update job");
      }

      toast.success("Job updated successfully!");
      navigate(`/job/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update job.");
      submittedRef.current = false;
    }
  };

  // Toggle job status
  const handleToggleStatus = async () => {
    const newStatus = jobData?.is_open === false ? true : false;
    try {
      await saveJob({
        jobData: { is_open: newStatus },
        job_id: id,
      });
      toast.success(newStatus ? "Job is now open" : "Job is now closed");
      fetchJob({ job_id: id });
    } catch (err) {
      toast.error("Failed to update job status");
    }
  };

  // Delete job
  const handleDeleteJob = async () => {
    try {
      await removeJob({ job_id: id });
      toast.success("Job deleted successfully!");
      navigate("/jobs", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job.");
    }
  };

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (loadingJob || loadingBrand) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
  }

  if (!jobData) {
    return (
      <div className="py-10">
        <div className="w-5/6 mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            variant="default"
            size="lg"
            className=""
            onClick={() => navigate("/jobs")}
          >
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="w-5/6 mx-auto mb-8">
        <BackButton />
        <h1 className="gradient-title font-extrabold text-4xl sm:text-5xl lg:text-6xl text-center mt-6">
          Edit Job
        </h1>
        <p className="text-center text-muted-foreground mt-4 text-lg">
          Update poster information and job details
        </p>
      </div>

      <DiscardChangesGuard
        show={showDialog}
        onDiscard={handleDiscard}
        onStay={handleStay}
      />

      <div className="w-5/6 mx-auto space-y-8">
        {/* Job Status Banner */}
        <div
          className={clsx(
            "rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4",
            jobData?.is_open !== false
              ? "bg-green-50 border-2 border-green-200"
              : "bg-red-50 border-2 border-red-200"
          )}
        >
          <div className="flex items-center gap-3">
            {jobData?.is_open !== false ? (
              <ToggleRight className="h-8 w-8 text-green-600" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-red-600" />
            )}
            <div>
              <h3 className="font-semibold text-lg">
                {jobData?.is_open !== false ? "Job is Open" : "Job is Closed"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {jobData?.is_open !== false
                  ? "This job is visible and accepting applications"
                  : "This job is hidden from the public listing"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleToggleStatus}
            className={clsx(
              "border-2 rounded-xl",
              jobData?.is_open !== false
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : "border-green-300 text-green-600 hover:bg-green-50"
            )}
          >
            {jobData?.is_open !== false ? "Close Job" : "Reopen Job"}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {jobData?.brand_id ? (
            <button
              onClick={() => setActiveTab("brand")}
              className={clsx(
                "flex-1 sm:flex-none px-8 py-4 rounded-xl text-base font-medium transition-all",
                activeTab === "brand"
                  ? "bg-cpg-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Brand Information
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("poster")}
              className={clsx(
                "flex-1 sm:flex-none px-8 py-4 rounded-xl text-base font-medium transition-all",
                activeTab === "poster"
                  ? "bg-cpg-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Poster Information
            </button>
          )}
          <button
            onClick={() => setActiveTab("job")}
            className={clsx(
              "flex-1 sm:flex-none px-8 py-4 rounded-xl text-base font-medium transition-all",
              activeTab === "job"
                ? "bg-cpg-teal text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Job Details
          </button>
        </div>

        {/* Poster Tab (for brandless jobs) */}
        {activeTab === "poster" && !jobData?.brand_id && (
          <div className="space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-semibold mb-6">Poster Information</h2>

              {/* Poster Logo */}
              <div className="mb-6">
                <Label className={classLabel}>Profile Photo</Label>
                <div className="flex items-center gap-6 mt-2">
                  {posterLogoPreview ? (
                    <div className="h-24 w-24 rounded-full border-2 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={posterLogoPreview}
                        alt="Poster photo"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={handlePosterLogoChange}
                      className="file:text-gray-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG or JPG, recommended 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Poster Name */}
              <div className="mb-6">
                <Label className={classLabel}>Display Name</Label>
                <Input
                  type="text"
                  placeholder="Your name or company name"
                  className={classInput}
                  value={posterName}
                  onChange={(e) => setPosterName(e.target.value)}
                />
              </div>

              {/* Poster Location */}
              <div>
                <Label className={classLabel}>Location (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. New York, NY"
                  className={classInput}
                  value={posterLocation}
                  onChange={(e) => setPosterLocation(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              onClick={handleSavePoster}
              disabled={savingJob}
              className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              {savingJob ? "Saving..." : "Save Poster Information"}
            </Button>
          </div>
        )}

        {/* Brand Tab */}
        {activeTab === "brand" && jobData?.brand_id && (
          <form onSubmit={brandForm.handleSubmit(handleSaveBrand)} className="space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Brand Information</h2>
                <p className="text-sm text-muted-foreground">
                  Changes will sync to all jobs under this brand
                </p>
              </div>

              {/* Logo */}
              <div className="mb-6">
                <Label className={classLabel}>Brand Logo</Label>
                <div className="flex items-center gap-6 mt-2">
                  {logoPreview ? (
                    <div className="h-24 w-24 rounded-full border-2 border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full border-2 border-gray-100 bg-gray-50 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={handleLogoChange}
                      className="file:text-gray-500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG or JPG, recommended 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Name */}
              <div className="mb-6">
                <RequiredLabel className={classLabel}>Brand Name</RequiredLabel>
                <Input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className={classInput}
                  {...brandForm.register("brand_name")}
                />
                {brandErrors.brand_name && (
                  <FormError message={brandErrors.brand_name.message} />
                )}
              </div>

              {/* Website */}
              <div className="mb-6">
                <Label className={classLabel}>Website</Label>
                <Input
                  type="text"
                  placeholder="https://yourcompany.com"
                  className={classInput}
                  {...brandForm.register("website")}
                />
                {brandErrors.website && (
                  <FormError message={brandErrors.website.message} />
                )}
              </div>

              {/* LinkedIn */}
              <div className="mb-6">
                <Label className={classLabel}>LinkedIn URL</Label>
                <Input
                  type="text"
                  placeholder="https://linkedin.com/company/yourcompany"
                  className={classInput}
                  {...brandForm.register("linkedin_url")}
                />
                {brandErrors.linkedin_url && (
                  <FormError message={brandErrors.linkedin_url.message} />
                )}
              </div>

              {/* Headquarters */}
              <div className="mb-6">
                <Label className={classLabel}>Headquarters Location</Label>
                <Input
                  type="text"
                  placeholder="e.g. New York, NY"
                  className={classInput}
                  {...brandForm.register("brand_hq")}
                />
              </div>

              {/* Description */}
              <div>
                <Label className={classLabel}>Brand Description</Label>
                <Textarea
                  placeholder="Tell us about your brand..."
                  className={classTextArea}
                  {...brandForm.register("brand_desc")}
                />
              </div>
            </div>

            {saveBrandError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <FormError message={saveBrandError.message} />
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={savingBrand}
              className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              {savingBrand ? "Saving Brand..." : "Save Brand Changes"}
            </Button>
          </form>
        )}

        {/* Job Tab */}
        {activeTab === "job" && (
          <form onSubmit={jobForm.handleSubmit(handleSaveJob)} className="space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-semibold mb-6">Job Details</h2>

              {/* Job Title */}
              <div className="mb-6">
                <RequiredLabel className={classLabel}>Job Title</RequiredLabel>
                <Input
                  type="text"
                  placeholder="e.g. Marketing Director"
                  className={classInput}
                  {...jobForm.register("job_title")}
                />
                {jobErrors.job_title && (
                  <FormError message={jobErrors.job_title.message} />
                )}
              </div>

              {/* Job Description Link */}
              {jobData?.job_description && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <Label className={classLabel}>Job Description PDF</Label>
                    <p className="text-sm text-muted-foreground">Currently uploaded document</p>
                  </div>
                  <a
                    href={jobData.job_description}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cpg-teal hover:underline font-medium"
                  >
                    View PDF <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* Grid: Scope, Location, Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Scope of Work */}
                <div>
                  <RequiredLabel className={classLabel}>Scope of Work</RequiredLabel>
                  <Controller
                    control={jobForm.control}
                    name="scope_of_work"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent className="">
                          <SelectItem className="" value="Ongoing">Ongoing</SelectItem>
                          <SelectItem className="" value="Project-based">Project-based</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {jobErrors.scope_of_work && (
                    <FormError message={jobErrors.scope_of_work.message} />
                  )}
                </div>

                {/* Work Location */}
                <div>
                  <RequiredLabel className={classLabel}>Work Location</RequiredLabel>
                  <Controller
                    control={jobForm.control}
                    name="work_location"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent className="">
                          <SelectItem className="" value="Remote">Remote</SelectItem>
                          <SelectItem className="" value="In-office">In-office</SelectItem>
                          <SelectItem className="" value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {jobErrors.work_location && (
                    <FormError message={jobErrors.work_location.message} />
                  )}
                </div>

                {/* Hours per Week */}
                <div>
                  <RequiredLabel className={classLabel}>Hours/Week</RequiredLabel>
                  <NumberInput
                    placeholder="e.g. 20"
                    className={classInput}
                    {...jobForm.register("estimated_hrs_per_wk")}
                  />
                  {jobErrors.estimated_hrs_per_wk && (
                    <FormError message="Please enter hours per week" />
                  )}
                </div>
              </div>

              {/* Area of Specialization & Level of Experience */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                {/* Area of Specialization */}
                <div>
                  <Controller
                    name="area_of_specialization"
                    control={jobForm.control}
                    render={({ field }) => {
                      const toggleValue = (value) => {
                        if (value === "Other") {
                          setShowOtherInput((prev) => !prev);
                          return;
                        }
                        const updated = field.value.includes(value)
                          ? field.value.filter((v) => v !== value)
                          : [...field.value, value];
                        field.onChange(updated);
                      };

                      const removeValue = (value) => {
                        field.onChange(field.value.filter((v) => v !== value));
                      };

                      return (
                        <div>
                          <RequiredLabel className={classLabel}>
                            Area of Specialization
                          </RequiredLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {areasOfSpecialization.map(({ label }) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => toggleValue(label)}
                                className={clsx(
                                  "rounded-lg px-3 py-2 text-sm font-medium border transition-all",
                                  field.value.includes(label)
                                    ? "bg-cpg-teal text-white border-cpg-teal"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-cpg-teal hover:bg-cpg-teal/5"
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {showOtherInput && (
                            <div className="flex gap-2 items-center mt-4">
                              <Input
                                type="text"
                                placeholder="Enter specialization"
                                value={otherSpec}
                                onChange={(e) => setOtherSpec(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="default"
                                size="lg"
                                className=""
                                onClick={() => {
                                  const trimmed = toTitleCase(otherSpec.trim());
                                  const isDuplicate = field.value.some(
                                    (val) => val.toLowerCase() === trimmed.toLowerCase()
                                  );
                                  const isValid = /^[A-Za-z\s]{3,}$/.test(trimmed);
                                  if (trimmed && !isDuplicate && isValid) {
                                    field.onChange([...field.value, trimmed]);
                                    setOtherSpec("");
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          )}

                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {field.value.map((val, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-2 bg-cpg-teal/10 text-cpg-teal text-sm font-medium px-3 py-1.5 rounded-full"
                                >
                                  {val}
                                  <button
                                    type="button"
                                    onClick={() => removeValue(val)}
                                    className="hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {jobErrors.area_of_specialization && (
                            <FormError message={jobErrors.area_of_specialization.message} />
                          )}
                        </div>
                      );
                    }}
                  />
                </div>

                {/* Level of Experience */}
                <div>
                  <Controller
                    name="level_of_experience"
                    control={jobForm.control}
                    render={({ field }) => {
                      const toggleValue = (value) => {
                        const updated = field.value.includes(value)
                          ? field.value.filter((v) => v !== value)
                          : [...field.value, value];
                        field.onChange(updated);
                      };

                      return (
                        <div>
                          <RequiredLabel className={classLabel}>
                            Level of Experience
                          </RequiredLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {levelsOfExperience.map(({ label }) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => toggleValue(label)}
                                className={clsx(
                                  "rounded-lg px-3 py-2 text-sm font-medium border transition-all",
                                  field.value.includes(label)
                                    ? "bg-cpg-teal text-white border-cpg-teal"
                                    : "bg-white text-gray-700 border-gray-200 hover:border-cpg-teal hover:bg-cpg-teal/5"
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {jobErrors.level_of_experience && (
                            <FormError message={jobErrors.level_of_experience.message} />
                          )}
                        </div>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Preferred Experience */}
              <div>
                <RequiredLabel className={classLabel}>
                  Preferred Experience
                </RequiredLabel>
                <Textarea
                  placeholder="Describe the ideal candidate's experience..."
                  className={classTextArea}
                  {...jobForm.register("preferred_experience")}
                />
                {jobErrors.preferred_experience && (
                  <FormError message={jobErrors.preferred_experience.message} />
                )}
              </div>
            </div>

            {saveJobError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <FormError message={saveJobError.message} />
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={savingJob}
              className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl"
            >
              <Save className="h-5 w-5 mr-2" />
              {savingJob ? "Saving Job..." : "Save Job Changes"}
            </Button>
          </form>
        )}

        {/* Danger Zone */}
        <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/50">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800">Warning</h3>
              <p className="text-sm text-red-600 mt-1 mb-4">
                Deleting this job is permanent and cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-2 border-red-300 text-red-600 hover:bg-red-100 rounded-xl"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={handleDeleteJob}
                    disabled={deletingJob}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {deletingJob ? "Deleting..." : "Yes, Delete Permanently"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(savingBrand || savingJob || deletingJob) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <BarLoader width={200} color="#00A19A" />
        </div>
      )}
    </div>
  );
};

export default EditJobPage;
