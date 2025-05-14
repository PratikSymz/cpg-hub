import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarLoader } from "react-spinners";
import { useForm, Controller, useWatch } from "react-hook-form";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getMyBrandProfile, updateBrand } from "@/api/apiBrands.js";
import { toast } from "sonner";
import { Loader2Icon, X } from "lucide-react";
import { syncUserProfile } from "@/api/apiUsers.js";
import { deleteJob, getSingleJob, updateJob } from "@/api/apiFractionalJobs.js";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import clsx from "clsx";

const brandSchema = z.object({
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last Name is required"),
  brand_name: z.string().min(1, { message: "Brand name is required" }),
  website: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  brand_hq: z.string().optional(),
  logo: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file?.[0] || // allow if no file selected
        ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
      { message: "Only PNG, JPG, or JPEG allowed" }
    ),
  brand_desc: z.string().min(1, { message: "Brand description is required" }),
});

const jobSchema = z.object({
  preferred_experience: z
    .string()
    .min(1, { message: "Preferred experience is required" }),
  level_of_experience: z.array(z.string()).min(1, "Select at least one level"),
  work_location: z.enum(["Remote", "In-office"], {
    message: "Select a work location",
  }),
  scope_of_work: z.enum(["Project-based", "Ongoing"], {
    message: "Select a scope of work",
  }),
  job_title: z.string().min(1, { message: "Title is required" }),
  estimated_hrs_per_wk: z.preprocess(
    (a) => {
      if (typeof a === "string") return parseInt(a, 10);
      if (typeof a === "number") return a;
      return undefined;
    },
    z
      .number()
      .int("Must be a whole number")
      .min(1, "Must be at least 1 hour/week")
      .lte(40, "Must be 40 or below")
  ),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Select at least one specialization"),
});

export const classLabel = "mb-1 block";
export const classInput = "input-class";

const EditJobPage = () => {
  const { id } = useParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  if (!user) {
    navigate("/");
  }

  const brandForm = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      brand_name: "",
      website: "",
      linkedin_url: "",
      brand_hq: "",
      brand_desc: "",
    },
    resolver: zodResolver(brandSchema),
  });
  const brandErrors = brandForm.formState.errors;

  const jobForm = useForm({
    defaultValues: {
      preferred_experience: "",
      level_of_experience: [],
      job_title: "",
      work_location: "Remote",
      scope_of_work: "Ongoing",
      area_of_specialization: [],
      estimated_hrs_per_wk: "",
    },
    resolver: zodResolver(jobSchema),
  });
  const jobErrors = jobForm.formState.errors;

  const {
    loading,
    data: brandData,
    func: fetchBrand,
  } = useFetch(getMyBrandProfile);
  const {
    loading: savingBrand,
    error: saveBrandError,
    func: saveBrand,
  } = useFetch(updateBrand);
  const { data: jobData, func: fetchJob } = useFetch(getSingleJob);
  const {
    loading: savingJob,
    error: saveJobError,
    func: saveJob,
  } = useFetch(updateJob);
  // Update User Profile
  const { func: updateUserProfile } = useFetch(syncUserProfile);
  const { loading: deleteLoading, func: jobDelete } = useFetch(deleteJob);

  const [logoPreview, setLogoPreview] = useState("");
  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchBrand({ user_id: user.id });
      fetchJob({ job_id: id });
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (brandData) {
      brandForm.reset({
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        brand_name: brandData.brand_name || "",
        website: brandData.website || "",
        linkedin_url: brandData.linkedin_url || "",
        brand_hq: brandData.brand_hq || "",
        brand_desc: brandData.brand_desc || "",
      });
      if (brandData.logo_url) setLogoPreview(brandData.logo_url);
    }

    if (jobData) {
      jobForm.reset({
        preferred_experience: jobData.preferred_experience ?? "",
        job_title: jobData.job_title ?? "",
        level_of_experience: jobData.level_of_experience ?? [],
        area_of_specialization: jobData.area_of_specialization ?? [],
        work_location: jobData.work_location ?? "",
        scope_of_work: jobData.scope_of_work ?? "",
        estimated_hrs_per_wk: jobData.estimated_hrs_per_wk ?? "",
      });
    }
  }, [user, brandData, jobData]);

  const [profileLoad, showProfileLoad] = useState(false);
  const handleProfilePictureClick = () => fileInputRef.current.click();
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Update Clerk profile picture
    try {
      showProfileLoad(true);
      await user.setProfileImage({ file });
      toast.success("Profile picture updated!");
      showProfileLoad(false);
    } catch (err) {
      toast.error("Failed to update profile picture.");
    }
  };

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const handleSubmitAll = () => {
    brandForm.handleSubmit(async (data) => {
      const firstName = data.first_name;
      const lastName = data.last_name;

      try {
        // Update Clerk first and last name if changed
        if (firstName !== user?.firstName || lastName !== user?.lastName) {
          await user.update({
            firstName,
            lastName,
          });
        }
        // Save Brand profile
        if (user && user.id) {
          await saveBrand(
            { ...data, logo_url: brandData.logo_url },
            { user_id: user.id }
          );
        }

        // Sync User profile
        if (isSignedIn && isLoaded && user) {
          await updateUserProfile({
            user_id: user.id,
            full_name: user.fullName,
            email: user.primaryEmailAddress.emailAddress,
            profile_picture_url: user.imageUrl,
          });
        }
        toast.success("Brand profile updated!");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update brand profile.");
      }
    })();

    jobForm.handleSubmit(async (data) => {
      await saveJob({
        jobData: {
          ...data,
          brand_id: user.id,
          is_open: true,
        },
        job_id: id,
      });
      toast.success("Job updated!");
    })();
  };

  const handleDelete = async () => {
    try {
      await jobDelete({ job_id: id });
      toast.success("Job successfully deleted!");
      navigate('/jobs');
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job!");
    }
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Edit Brand and Job</h1>

      {/* --- BRAND DETAILS --- */}
      <div className="border rounded-xl p-8 bg-white space-y-6">
        <h2 className="text-3xl font-semibold">Brand Details</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Update your brand profile information.
        </p>
        <form className="flex flex-col space-y-6">
          {/* Profile Pic */}
          <div className="flex gap-6 items-center my-4">
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full border object-cover cursor-pointer"
              onClick={handleProfilePictureClick}
            />
            {profileLoad && <Loader2Icon className="animate-spin h-6 w-6" />}

            <div>
              <p className="font-semibold">
                {user.primaryEmailAddress.emailAddress}
              </p>
              <p className="text-sm text-gray-500">(Click image to update)</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          {/* First and Last name */}
          <div className="grid grid-cols-2 gap-6 my-6">
            <div>
              <Label className={classLabel}>First Name</Label>
              <Input
                className={classInput}
                type="text"
                name="first_name"
                placeholder="First name"
                {...brandForm.register("first_name")}
              />
              {brandErrors.first_name && (
                <p className="text-red-500">{brandErrors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label className={classLabel}>Last Name</Label>
              <Input
                className={classInput}
                type="text"
                name="last_name"
                placeholder="Last name"
                {...brandForm.register("last_name")}
              />
              {brandErrors.last_name && (
                <p className="text-red-500">{brandErrors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <Label className={classLabel}>Brand Name</Label>
            <Input
              className={classInput}
              type="text"
              {...brandForm.register("brand_name")}
              placeholder="e.g. Slingshot Coffee"
            />
            {brandErrors.brand_name && (
              <p className="text-red-500">{brandErrors.brand_name.message}</p>
            )}
          </div>

          <div>
            <Label className={classLabel}>Brand Description</Label>
            <Textarea
              className="textarea-class resize block w-full h-24"
              {...brandForm.register("brand_desc")}
              placeholder="e.g. We believe everyone should have better, more exciting coffee experiences..."
            />
            {brandErrors.brand_desc && (
              <p className="text-sm text-red-500">
                {brandErrors.brand_desc.message}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <Label className={classLabel}>Website</Label>
            <Input
              className={classInput}
              type="url"
              {...brandForm.register("website")}
              placeholder="https://yourbrand.com"
            />
            {brandErrors.website && (
              <p className="text-red-500">{brandErrors.website.message}</p>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <Label className={classLabel}>LinkedIn URL</Label>
            <Input
              className={classInput}
              type="url"
              {...brandForm.register("linkedin_url")}
              placeholder="https://linkedin.com/company/your-brand"
            />
            {brandErrors.linkedin_url && (
              <p className="text-red-500">{brandErrors.linkedin_url.message}</p>
            )}
          </div>

          {/* Brand HQ */}
          <div>
            <Label className={classLabel}>Brand HQ</Label>
            <Input
              className={classInput}
              type="text"
              {...brandForm.register("brand_hq")}
              placeholder="New York, NY"
            />
          </div>

          {/* Logo */}
          <div>
            <Label className={classLabel}>Brand Logo</Label>
            {logoPreview && (
              <div className="mb-4">
                <img
                  src={logoPreview}
                  alt="Current Logo"
                  className="h-24 w-24 aspect-3/2 object-contain rounded border scale-100"
                />
              </div>
            )}
            <Input
              className={classInput}
              type="file"
              accept="image/*"
              {...brandForm.register("logo")}
            />
          </div>

          {saveBrandError && (
            <p className="text-red-500">{saveBrandError.message}</p>
          )}
        </form>
      </div>

      {/* --- JOB DETAILS --- */}
      <div className="border rounded-xl p-8 bg-white space-y-6">
        <h2 className="text-3xl font-semibold">Job Details</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Edit your job posting information.
        </p>

        <form className="flex flex-col space-y-6">
          {/* Job title */}
          <Input
            placeholder="Job Title"
            type="text"
            className="input-class"
            {...jobForm.register("job_title")}
          />
          {jobErrors.job_title && (
            <p className="text-sm text-red-500">
              {jobErrors.job_title.message}
            </p>
          )}

          <div className="flex flex-row gap-16 justify-around my-6">
            {/* Scope of Work */}
            <div className="flex-1">
              <Label className="mb-4 block">Scope of Work</Label>
              <Controller
                control={jobForm.control}
                name="scope_of_work"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="scopeOfWork" className="w-full">
                      <SelectValue placeholder="Select work scope" />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem className="" value="Ongoing">
                        Ongoing
                      </SelectItem>
                      <SelectItem className="" value="Project-based">
                        Project-based
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {jobErrors.scope_of_work && (
                <p className="text-sm text-red-500">
                  {jobErrors.scope_of_work.message}
                </p>
              )}
            </div>

            {/* Work Location */}
            <div className="flex-1">
              <Label className="mb-4 block">Work Location</Label>
              <Controller
                control={jobForm.control}
                name="work_location"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="workLocation" className="w-full">
                      <SelectValue placeholder="Select work location" />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem className="" value="Remote">
                        Remote
                      </SelectItem>
                      <SelectItem className="" value="In-office">
                        In-office
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {jobErrors.work_location && (
                <p className="text-sm text-red-500">
                  {jobErrors.work_location.message}
                </p>
              )}
            </div>

            {/* Estimated hrs/wk */}
            <div className="flex-1">
              <Label className="mb-4 block">Estimated hrs/week</Label>
              <Input
                placeholder="40"
                type="text"
                className="input-class"
                {...jobForm.register("estimated_hrs_per_wk")}
              />
              {jobErrors.estimated_hrs_per_wk && (
                <p className="text-sm text-red-500">
                  {jobErrors.estimated_hrs_per_wk.message}
                </p>
              )}
            </div>
          </div>

          {/* Area of Spec and Level of Exp */}
          <div className="flex flex-col lg:flex-row gap-20 my-6">
            {/* Area of Specialization */}
            <div className="flex-1">
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
                    const updated = field.value.filter((v) => v !== value);
                    field.onChange(updated);

                    // if (value === "Other") {
                    //   setShowOtherInput(false);
                    //   setOtherSpec("");
                    // }
                  };

                  return (
                    <div>
                      <Label className="mb-4 block">
                        Area of Specialization
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {areasOfSpecialization.map(({ label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleValue(label)}
                            className={clsx(
                              "rounded-md px-4 py-2 text-sm font-medium border",
                              field.value.includes(label)
                                ? "bg-teal-600 text-white border-transparent"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Other input box */}
                      {showOtherInput && (
                        <div className="flex gap-2 items-center my-4">
                          <Input
                            type="text"
                            placeholder="Enter your specialization"
                            value={otherSpec}
                            onChange={(e) => setOtherSpec(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            className=""
                            variant="default"
                            size="lg"
                            type="button"
                            onClick={() => {
                              const trimmed = toTitleCase(otherSpec.trim());
                              // Check: valid string, not a duplicate (case-insensitive)
                              const isDuplicate = field.value.some(
                                (val) =>
                                  val.toLowerCase() === trimmed.toLowerCase()
                              );
                              // Min 3 letters, no special chars
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

                      {/* Show selected values as tags */}
                      <div className="flex flex-wrap gap-2 my-4">
                        {(field.value ?? []).map((val, idx) => (
                          <span
                            key={idx}
                            className="flex items-center bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeValue(val)}
                              className="ml-2 text-teal-800 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {jobErrors.area_of_specialization && (
                <p className="text-sm text-red-500">
                  {jobErrors.area_of_specialization.message}
                </p>
              )}
            </div>

            {/* Level of Experience */}
            <div className="flex-1">
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
                      <Label className="mb-4 block">Level of Experience</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {levelsOfExperience.map(({ label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleValue(label)}
                            className={clsx(
                              "rounded-md px-4 py-2 text-sm font-medium border",
                              field.value.includes(label)
                                ? "bg-teal-600 text-white border-transparent"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {jobErrors.level_of_experience && (
                <p className="text-sm text-red-500">
                  {jobErrors.level_of_experience.message}
                </p>
              )}
            </div>
          </div>

          {/* Preferred Experience */}
          <div>
            <Label className="mb-4 block">Preferred Experience</Label>
            <Textarea
              placeholder="Preferred Experience"
              className="textarea-class resize block w-full h-24"
              {...jobForm.register("preferred_experience")}
            />
            {jobErrors.preferred_experience && (
              <p className="text-sm text-red-500">
                {jobErrors.preferred_experience.message}
              </p>
            )}
          </div>
        </form>
      </div>

      <Button
        variant="default"
        size="lg"
        onClick={handleSubmitAll}
        disabled={savingBrand || savingJob}
        className="w-full bg-cpg-brown hover:bg-cpg-brown/90"
      >
        {savingBrand || savingJob ? "Saving..." : "Save All Changes"}
        {savingBrand && <Loader2Icon className="animate-spin h-6 w-6" />}
      </Button>

      <Button
        variant="default"
        size="lg"
        onClick={handleDelete}
        className="w-full bg-red-600"
      >
        Delete Job
      </Button>
    </div>
  );
};

export default EditJobPage;
