import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarLoader } from "react-spinners";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getMyBrandProfile, updateBrand } from "@/api/apiBrands.js";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import clsx from "clsx";
import { BrandSchemaWithName } from "@/schemas/brand-schema.js";
import { JobSchema } from "@/schemas/job-schema.js";
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
import { ArrowLeft } from "lucide-react";

const EditJobPage = () => {
  const { id } = useParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);

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
    resolver: zodResolver(BrandSchemaWithName),
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
    resolver: zodResolver(JobSchema),
  });

  const handleBackClick = () => {
    if (brandForm.formState.isDirty || jobForm.formState.isDirty) {
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

      navigate("/jobs", { replace: true });
      toast.success("Job updated!");
    })();
  };

  const handleDelete = async () => {
    try {
      await jobDelete({ job_id: id });
      toast.success("Job successfully deleted!");
      navigate("/jobs");
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
      <div>
        <Button
          className=""
          onClick={handleBackClick}
          variant="ghost"
          size="default"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hover:underline">Back</span>
        </Button>

        <DiscardChangesGuard
          show={showDialog}
          onDiscard={handleDiscard}
          onStay={handleStay}
        />
      </div>
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
              <RequiredLabel className={classLabel}>First Name</RequiredLabel>
              <Input
                className={classInput}
                type="text"
                name="first_name"
                placeholder="First name"
                {...brandForm.register("first_name")}
              />
              {brandErrors.first_name && (
                <FormError message={brandErrors.first_name.message} />
              )}
            </div>

            <div>
              <RequiredLabel className={classLabel}>Last Name</RequiredLabel>
              <Input
                className={classInput}
                type="text"
                name="last_name"
                placeholder="Last name"
                {...brandForm.register("last_name")}
              />
              {brandErrors.last_name && (
                <FormError message={brandErrors.last_name.message} />
              )}
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <RequiredLabel className={classLabel}>Brand Name</RequiredLabel>
            <Input
              className={classInput}
              type="text"
              {...brandForm.register("brand_name")}
              placeholder="e.g. Slingshot Coffee"
            />
            {brandErrors.brand_name && (
              <FormError message={brandErrors.brand_name.message} />
            )}
          </div>

          <div>
            <RequiredLabel className={classLabel}>
              Brand Description
            </RequiredLabel>
            <Textarea
              className={classTextArea}
              {...brandForm.register("brand_desc")}
              placeholder="e.g. We believe everyone should have better, more exciting coffee experiences..."
            />
            {brandErrors.brand_desc && (
              <FormError message={brandErrors.brand_desc.message} />
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
              <FormError message={brandErrors.website.message} />
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
              <FormError message={brandErrors.linkedin_url.message} />
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
            {brandErrors.brand_hq && (
              <FormError message={brandErrors.brand_hq.message} />
            )}
          </div>

          {/* Logo */}
          <div>
            <RequiredLabel className={classLabel}>Brand Logo</RequiredLabel>
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

            {brandErrors.logo && (
              <FormError message={brandErrors.logo.message.toString()} />
            )}
          </div>

          {saveBrandError && <FormError message={saveBrandError.message} />}
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
          <RequiredLabel className={classLabel}>Job Title</RequiredLabel>
          <Input
            placeholder="Job Title"
            type="text"
            className={classInput}
            {...jobForm.register("job_title")}
          />
          {jobErrors.job_title && (
            <FormError message={jobErrors.job_title.message} />
          )}

          {/* Job Description upload */}
          <div>
            <Label className={classLabel}>Job Description</Label>
            {jobData?.job_description && (
              <a
                href={jobData?.job_description}
                target="_blank"
                className="underline text-sm font-medium text-cpg-teal mb-4 block"
              >
                View current description
              </a>
            )}
            <Input
              className={classInput}
              type="file"
              accept=".pdf,.doc,.docx"
              {...jobForm.register("job_description")}
            />
            {jobErrors.job_description && (
              <FormError
                message={jobErrors.job_description.message.toString()}
              />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 justify-around my-6">
            {/* Scope of Work */}
            <div className="flex-1">
              <RequiredLabel className={classLabel}>
                Scope of Work
              </RequiredLabel>
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
                <FormError message={jobErrors.scope_of_work.message} />
              )}
            </div>

            {/* Work Location */}
            <div className="flex-1">
              <RequiredLabel className={classLabel}>
                Work Location
              </RequiredLabel>
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
                <FormError message={jobErrors.work_location.message} />
              )}
            </div>

            {/* Estimated hrs/wk */}
            <div className="flex-1">
              <RequiredLabel className={classLabel}>
                Estimated hrs/week
              </RequiredLabel>
              <NumberInput
                placeholder="40"
                className={classInput}
                {...jobForm.register("estimated_hrs_per_wk")}
              />
              {jobErrors.estimated_hrs_per_wk && (
                <FormError
                  message={"Please enter the estimated hours per week"}
                />
              )}
            </div>
          </div>

          {/* Area of Spec and Level of Exp */}
          <div className="flex flex-col lg:flex-row gap-8 my-8">
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
                      <RequiredLabel className={classLabel}>
                        Area of Specialization
                      </RequiredLabel>
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
                      <div className="flex flex-wrap gap-2 my-2">
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
                      {jobErrors.area_of_specialization && (
                        <FormError
                          message={jobErrors.area_of_specialization.message}
                        />
                      )}
                    </div>
                  );
                }}
              />
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
                      <Label className={classLabel}>Level of Experience</Label>
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
                      {jobErrors.level_of_experience && (
                        <FormError
                          message={jobErrors.level_of_experience.message}
                        />
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
              placeholder="Preferred Experience"
              className={classTextArea}
              {...jobForm.register("preferred_experience")}
            />
            {jobErrors.preferred_experience && (
              <FormError message={jobErrors.preferred_experience.message} />
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
