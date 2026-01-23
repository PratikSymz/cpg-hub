/**
 * @fileoverview Job posting page component
 * Allows users to post fractional job listings with flexible poster options.
 * Users can post as themselves (personal), their talent/service profile, or a company.
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Third-party libraries
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Plus, Send, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

// API functions
import { addNewBrand, getMyBrands } from "@/api/apiBrands.js";
import { postJob } from "@/api/apiFractionalJobs.js";
import { getMyServiceProfile } from "@/api/apiServices.js";
import { getMyTalentProfile } from "@/api/apiTalent.js";

// UI Components
import FormError from "@/components/form-error.jsx";
import NumberInput from "@/components/number-input.jsx";
import RequiredLabel from "@/components/required-label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

// Hooks
import useFetch from "@/hooks/use-fetch.jsx";

// Constants and schemas
import {
  classInput,
  classLabel,
  classTextArea,
} from "@/constants/classnames.js";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import { ROLE_BRAND, ROLE_SERVICE, ROLE_TALENT } from "@/constants/roles.js";
import { JobPostingSchema } from "@/schemas/job-posting-schema.js";

/**
 * PostJob Component
 *
 * Provides a form for users to create fractional job listings.
 *
 * Poster Options:
 * - "Me" (personal): Posts using user's Clerk profile info
 * - "My Talent Profile": Posts using talent profile (if exists)
 * - "My Service Profile": Posts using service profile (if exists)
 * - "My Company": Posts using existing brand (if any)
 * - "Add a Company": Creates new brand and posts with it
 *
 * @returns {JSX.Element} The job posting form
 */
const PostJob = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const submittedRef = useRef(false);

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showAdditionalBrandInfo, setShowAdditionalBrandInfo] = useState(false);

  // Profile and brand state
  const [userBrands, setUserBrands] = useState([]);
  const [talentProfile, setTalentProfile] = useState(null);
  const [serviceProfile, setServiceProfile] = useState(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // Get user's roles from metadata
  const userRoles = user?.unsafeMetadata?.roles || [];

  // Default poster type is always "personal" (simplest option)
  const getDefaultPosterType = () => {
    return "personal";
  };

  // Fetch profiles on mount
  const { func: fetchBrands } = useFetch(getMyBrands);
  const { func: fetchTalentProfile } = useFetch(getMyTalentProfile);
  const { func: fetchServiceProfile } = useFetch(getMyServiceProfile);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Poster type
      poster_type: "personal",
      // Brand selection
      brand_selection: "none",
      brand_profile_id: "",
      // New brand fields
      brand_name: "",
      brand_logo: null,
      brand_website: "",
      brand_location: "",
      brand_linkedin_url: "",
      brand_desc: "",
      // Job fields
      preferred_experience: "",
      level_of_experience: [],
      job_title: "",
      work_location: "Remote",
      scope_of_work: "Ongoing",
      area_of_specialization: [],
      estimated_hrs_per_wk: "",
    },
    resolver: zodResolver(JobPostingSchema),
  });

  const posterType = watch("poster_type");
  const brandSelection = watch("brand_selection");

  // Load profiles on mount
  useEffect(() => {
    if (isLoaded && user?.id) {
      const loadProfiles = async () => {
        // Fetch all data in parallel
        const [brandsResult, talentResult, serviceResult] = await Promise.all([
          fetchBrands({ user_id: user.id }),
          fetchTalentProfile({ user_id: user.id }),
          fetchServiceProfile({ user_id: user.id }),
        ]);

        // Extract data from useFetch wrapper objects
        const brandsData = brandsResult?.data || [];
        const talentData = talentResult?.data || null;
        const serviceData = serviceResult?.data || null;

        setUserBrands(brandsData);
        setTalentProfile(talentData);
        setServiceProfile(serviceData);
        setProfilesLoaded(true);

        // Sync brand role if user has brands but role is missing
        if (brandsData.length > 0) {
          const existingRoles = Array.isArray(user?.unsafeMetadata?.roles)
            ? user.unsafeMetadata.roles
            : [];
          if (!existingRoles.includes(ROLE_BRAND)) {
            await user.update({
              unsafeMetadata: { roles: [...existingRoles, ROLE_BRAND] },
            });
          }
        }

        // Set default poster type based on available profiles
        const defaultType = getDefaultPosterType();
        setValue("poster_type", defaultType);

        // Default to "none" for brand selection (posting as personal)
        setValue("brand_selection", "none");
        setValue("brand_profile_id", "");
      };

      loadProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id]);

  // Derived state for profile existence (requires BOTH role in metadata AND database record)
  const hasTalentProfile = userRoles.includes(ROLE_TALENT) && !!talentProfile;
  const hasServiceProfile =
    userRoles.includes(ROLE_SERVICE) && !!serviceProfile;

  // API for creating job
  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    func: funcCreateJob,
  } = useFetch(postJob);

  // API for creating brand
  const { loading: loadingCreateBrand, func: funcCreateBrand } =
    useFetch(addNewBrand);

  const onSubmit = async (data) => {
    if (submittedRef.current) {
      console.warn("Duplicate submission prevented");
      return;
    }
    submittedRef.current = true;

    try {
      if (user && user.id) {
        let brandId = null;

        // Set brandId based on brand selection
        if (data.brand_selection === "existing" && data.brand_profile_id) {
          brandId = data.brand_profile_id;
        } else if (data.brand_selection === "new") {
          // If creating new brand, create it first
          const brandResult = await funcCreateBrand({
            user_id: user.id,
            brand_name: data.brand_name,
            logo: data.brand_logo,
            website: data.brand_website,
            brand_hq: data.brand_location,
            linkedin_url: data.brand_linkedin_url,
            brand_desc: data.brand_desc,
          });

          if (!brandResult || brandResult.error || !brandResult.data) {
            throw new Error("Failed to create brand");
          }

          brandId = brandResult.data[0].id;

          // Update local brands list
          setUserBrands((prev) => [
            brandResult.data[0],
            ...(Array.isArray(prev) ? prev : []),
          ]);

          // Update user role to include "brand" if not already present
          const existingRoles = Array.isArray(user?.unsafeMetadata?.roles)
            ? user.unsafeMetadata.roles
            : [];
          if (!existingRoles.includes(ROLE_BRAND)) {
            await user.update({
              unsafeMetadata: { roles: [...existingRoles, ROLE_BRAND] },
            });
          }
        }

        // Create the job
        const result = await funcCreateJob({
          job_title: data.job_title,
          preferred_experience: data.preferred_experience,
          level_of_experience: data.level_of_experience,
          work_location: data.work_location,
          scope_of_work: data.scope_of_work,
          estimated_hrs_per_wk: data.estimated_hrs_per_wk,
          area_of_specialization: data.area_of_specialization,
          job_description: data.job_description,
          user_id: user.id,
          poster_type: data.poster_type,
          brand_profile_id: brandId,
        });

        if (result.error) {
          throw new Error(errorCreateJob?.message || "Failed to create job");
        }

        navigate("/jobs", { replace: true });
        toast.success("Job posted successfully!");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to post job!");
      submittedRef.current = false;
    }
  };

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (!isLoaded || !profilesLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="py-10">
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        Post a Job
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col w-5/6 mx-auto gap-8"
      >
        {/* Unified Poster Selection */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            Who's posting this job?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Me - Always shown */}
            <button
              type="button"
              onClick={() => {
                setValue("poster_type", "personal");
                setValue("brand_selection", "none");
                setValue("brand_profile_id", "");
              }}
              className={clsx(
                "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                posterType === "personal"
                  ? "border-cpg-teal bg-cpg-teal/10"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              <img
                src={user?.imageUrl}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
              />
              <div className="min-w-0">
                <p
                  className={clsx(
                    "font-semibold truncate",
                    posterType === "personal"
                      ? "text-cpg-teal"
                      : "text-gray-900",
                  )}
                >
                  Me
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.fullName || "Your Name"}
                </p>
              </div>
            </button>

            {/* My Talent Profile - Only if user has talent profile */}
            {hasTalentProfile && (
              <button
                type="button"
                onClick={() => {
                  setValue("poster_type", "talent");
                  setValue("brand_selection", "none");
                  setValue("brand_profile_id", "");
                }}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  posterType === "talent"
                    ? "border-cpg-teal bg-cpg-teal/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                <img
                  src={
                    talentProfile?.user_info?.profile_picture_url ||
                    user?.imageUrl
                  }
                  alt="Talent Profile"
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p
                    className={clsx(
                      "font-semibold truncate",
                      posterType === "talent"
                        ? "text-cpg-teal"
                        : "text-gray-900",
                    )}
                  >
                    My Talent Profile
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {talentProfile?.area_of_specialization?.[0] ||
                      "Fractional Talent"}
                  </p>
                </div>
              </button>
            )}

            {/* My Service Profile - Only if user has service profile */}
            {hasServiceProfile && (
              <button
                type="button"
                onClick={() => {
                  setValue("poster_type", "service");
                  setValue("brand_selection", "none");
                  setValue("brand_profile_id", "");
                }}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  posterType === "service"
                    ? "border-cpg-teal bg-cpg-teal/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {serviceProfile?.logo_url ? (
                  <img
                    src={serviceProfile.logo_url}
                    alt="Service Logo"
                    className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-lg font-bold">
                      {serviceProfile?.company_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className={clsx(
                      "font-semibold truncate",
                      posterType === "service"
                        ? "text-cpg-teal"
                        : "text-gray-900",
                    )}
                  >
                    My Service Profile
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {serviceProfile?.company_name}
                  </p>
                </div>
              </button>
            )}

            {/* My Company - Only if user has brands */}
            {userBrands.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setValue("poster_type", "brand");
                  setValue("brand_selection", "existing");
                  setValue("brand_profile_id", userBrands[0].id.toString());
                }}
                className={clsx(
                  "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  posterType === "brand" && brandSelection === "existing"
                    ? "border-cpg-teal bg-cpg-teal/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {userBrands[0]?.logo_url ? (
                  <img
                    src={userBrands[0].logo_url}
                    alt="Brand Logo"
                    className="h-12 w-12 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-lg font-bold">
                      {userBrands[0]?.brand_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className={clsx(
                      "font-semibold truncate",
                      posterType === "brand" && brandSelection === "existing"
                        ? "text-cpg-teal"
                        : "text-gray-900",
                    )}
                  >
                    My Company
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {userBrands.length === 1
                      ? userBrands[0].brand_name
                      : `${userBrands.length} companies`}
                  </p>
                </div>
              </button>
            )}

            {/* Add a Company - Always shown */}
            <button
              type="button"
              onClick={() => {
                setValue("poster_type", "brand");
                setValue("brand_selection", "new");
                setValue("brand_profile_id", "");
              }}
              className={clsx(
                "flex items-center gap-4 p-4 rounded-lg border-2 border-dashed transition-all text-left",
                posterType === "brand" && brandSelection === "new"
                  ? "border-cpg-teal bg-cpg-teal/10"
                  : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50",
              )}
            >
              <div className="h-12 w-12 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p
                  className={clsx(
                    "font-semibold truncate",
                    posterType === "brand" && brandSelection === "new"
                      ? "text-cpg-teal"
                      : "text-gray-900",
                  )}
                >
                  Add a Company
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  Create a new brand profile
                </p>
              </div>
            </button>
          </div>
          {errors.poster_type && (
            <FormError message={errors.poster_type.message} />
          )}
        </div>

        {/* Brand Selection Dropdown - Only show if user selected "My Company" and has multiple brands */}
        {posterType === "brand" &&
          brandSelection === "existing" &&
          userBrands.length > 1 && (
            <div>
              <Label className={classLabel}>Select Company</Label>
              <Controller
                control={control}
                name="brand_profile_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {userBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.brand_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.brand_profile_id && (
                <FormError message={errors.brand_profile_id.message} />
              )}
            </div>
          )}

        {/* New brand form - shown when "Add a Company" is selected */}
        {posterType === "brand" && brandSelection === "new" && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-6">New Company Details</h2>

            {/* Brand Name - Required */}
            <div className="mb-6">
              <RequiredLabel className={classLabel}>Brand Name</RequiredLabel>
              <Input
                type="text"
                placeholder="e.g. Acme Corp"
                className={classInput}
                {...register("brand_name")}
              />
              {errors.brand_name && (
                <FormError message={errors.brand_name.message} />
              )}
            </div>

            {/* Logo - Required */}
            <div className="mb-6">
              <RequiredLabel className={classLabel}>Logo</RequiredLabel>
              {watch("brand_logo")?.[0] && (
                <img
                  src={URL.createObjectURL(watch("brand_logo")[0])}
                  alt="Logo Preview"
                  className="my-2 max-h-32 rounded-lg"
                />
              )}
              <Input
                type="file"
                accept="image/png,image/jpg,image/jpeg"
                className="file:text-gray-500"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files.length > 0) {
                    setValue("brand_logo", files, { shouldValidate: true });
                  } else {
                    setValue("brand_logo", null, { shouldValidate: true });
                  }
                }}
              />
              {errors.brand_logo && (
                <FormError message={errors.brand_logo.message} />
              )}
            </div>

            {/* Website - Required */}
            <div className="mb-6">
              <RequiredLabel className={classLabel}>Website</RequiredLabel>
              <Input
                type="text"
                className={classInput}
                placeholder="https://yourcompany.com"
                {...register("brand_website")}
              />
              {errors.brand_website && (
                <FormError message={errors.brand_website.message} />
              )}
            </div>

            {/* Optional Fields - Collapsible */}
            <div className="border-t pt-4 mt-6">
              <Button
                type="button"
                size="default"
                variant="ghost"
                onClick={() =>
                  setShowAdditionalBrandInfo(!showAdditionalBrandInfo)
                }
                className="w-full flex items-center justify-between py-4 px-0 hover:bg-transparent hover:underline"
              >
                <span className="text-lg font-semibold">
                  Additional Info (Optional)
                </span>
                {showAdditionalBrandInfo ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>

              {showAdditionalBrandInfo && (
                <div className="mt-4 space-y-6 px-2">
                  {/* Location */}
                  <div>
                    <Label className={classLabel}>Headquarters Location</Label>
                    <Input
                      type="text"
                      className={classInput}
                      placeholder="e.g. New York, NY"
                      {...register("brand_location")}
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div>
                    <Label className={classLabel}>LinkedIn URL</Label>
                    <Input
                      type="text"
                      className={classInput}
                      placeholder="https://linkedin.com/company/yourcompany"
                      {...register("brand_linkedin_url")}
                    />
                    {errors.brand_linkedin_url && (
                      <FormError message={errors.brand_linkedin_url.message} />
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label className={classLabel}>Brand Description</Label>
                    <Textarea
                      className={classTextArea}
                      placeholder="Tell us about your brand..."
                      {...register("brand_desc")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Job Details Section */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-6">Job Details</h2>

          {/* Job title */}
          <div className="mb-6">
            <RequiredLabel className={classLabel}>Job Title</RequiredLabel>
            <Input
              placeholder="Job Title"
              type="text"
              className={classInput}
              {...register("job_title")}
            />
            {errors.job_title && (
              <FormError message={errors.job_title.message} />
            )}
          </div>

          {/* Job Description upload */}
          <div className="mb-6">
            <Label className={classLabel}>Upload Job Description</Label>
            <Input
              className={classInput}
              type="file"
              accept=".pdf"
              {...register("job_description")}
            />
            {errors.job_description && (
              <FormError message={errors.job_description.message?.toString()} />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 justify-around my-6">
            {/* Scope of Work */}
            <div className="flex-1">
              <RequiredLabel className={classLabel}>
                Scope of Work
              </RequiredLabel>
              <Controller
                control={control}
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
              {errors.scope_of_work && (
                <FormError message={errors.scope_of_work.message} />
              )}
            </div>

            {/* Work Location */}
            <div className="flex-1">
              <RequiredLabel className={classLabel}>
                Work Location
              </RequiredLabel>
              <Controller
                control={control}
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
                      <SelectItem className="" value="Hybrid">
                        Hybrid
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.work_location && (
                <FormError message={errors.work_location.message} />
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
                {...register("estimated_hrs_per_wk")}
              />
              {errors.estimated_hrs_per_wk && (
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
                control={control}
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
                                ? "bg-cpg-teal text-white border-transparent"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

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
                              const isDuplicate = field.value.some(
                                (val) =>
                                  val.toLowerCase() === trimmed.toLowerCase(),
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

                      <div className="flex flex-wrap gap-2 my-2">
                        {(field.value ?? []).map((val, idx) => (
                          <span
                            key={idx}
                            className="flex items-center bg-cpg-teal/15 text-cpg-teal text-sm font-medium px-3 py-1 rounded-full"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeValue(val)}
                              className="ml-2 text-cpg-teal hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      {errors.area_of_specialization && (
                        <FormError
                          message={errors.area_of_specialization.message}
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
                control={control}
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
                      <div className="grid grid-cols-2 gap-3">
                        {levelsOfExperience.map(({ label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleValue(label)}
                            className={clsx(
                              "rounded-md px-4 py-2 text-sm font-medium border",
                              field.value.includes(label)
                                ? "bg-cpg-teal text-white border-transparent"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {errors.level_of_experience && (
                        <FormError
                          message={errors.level_of_experience.message}
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
              {...register("preferred_experience")}
            />
            {errors.preferred_experience && (
              <FormError message={errors.preferred_experience.message} />
            )}
          </div>
        </div>

        {errorCreateJob?.message && (
          <FormError message={errorCreateJob?.message} />
        )}

        {(loadingCreateJob || loadingCreateBrand) && (
          <BarLoader width={"100%"} color="#36d7b7" />
        )}
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={loadingCreateJob || loadingCreateBrand}
          className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl mt-6"
        >
          <Send className="h-5 w-5 mr-2" />
          {loadingCreateJob || loadingCreateBrand
            ? "Posting Job..."
            : "Post Job"}
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
