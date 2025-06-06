import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getMyTalentProfile, updateTalent } from "@/api/apiTalent.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";
import { Loader2Icon, X } from "lucide-react";
import { syncUserProfile } from "@/api/apiUsers.js";
import TalentExperienceSection from "@/components/experience-section.jsx";
import { TalentSchemaWithName } from "@/schemas/talent-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import RequiredLabel from "@/components/required-label.jsx";
import {
  classLabel,
  classInput,
  classTextArea,
} from "@/constants/classnames.js";
import FormError from "@/components/form-error.jsx";

const EditTalentPage = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      level_of_experience: [],
      industry_experience: "",
      area_of_specialization: [],
      linkedin_url: "",
      portfolio_url: "",
    },
    resolver: zodResolver(TalentSchemaWithName),
  });

  const {
    func: fetchTalent,
    data: talentData,
    loading,
  } = useFetch(getMyTalentProfile);

  const {
    func: saveTalent,
    loading: savingTalent,
    error: saveError,
  } = useFetch(updateTalent);

  // Load talent profile
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchTalent({ user_id: user.id });
    }
  }, [isLoaded]);

  // Update User Profile
  const { func: updateUserProfile } = useFetch(syncUserProfile);

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSpecError, setOtherSpecError] = useState("");
  const [profileLoad, showProfileLoad] = useState(false);

  // Prefill form
  useEffect(() => {
    if (talentData) {
      setValue("first_name", user.firstName || "");
      setValue("last_name", user.lastName || "");
      setValue("level_of_experience", talentData.level_of_experience || []);
      setValue("industry_experience", talentData.industry_experience || "");
      setValue(
        "area_of_specialization",
        talentData.area_of_specialization || []
      );
      setValue("linkedin_url", talentData.linkedin_url || "");
      setValue("portfolio_url", talentData.portfolio_url || "");
    }
  }, [user, talentData]);

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update Clerk profile picture
    try {
      showProfileLoad(true);
      await user.setProfileImage({
        file,
      });

      toast.success("Profile picture updated!");
      showProfileLoad(false);
    } catch (err) {
      console.error(err);
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

  const onSubmit = async (data) => {
    const combinedAreaOfSpec = otherSpec
      ? [...data.area_of_specialization, otherSpec]
      : data.area_of_specialization;

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

      // Save Talent profile
      if (user && user.id) {
        await saveTalent(
          {
            ...data,
            area_of_specialization: combinedAreaOfSpec,
            resume_url: talentData.resume_url,
          },
          { user_id: user.id }
        );
      }

      // Sync User profile
      if (isSignedIn && isLoaded && user) {
        await updateUserProfile({
          user_id: user?.id,
          full_name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          profile_picture_url: user?.imageUrl || "",
        });
      }

      toast.success("Profile Updated!");
      navigate("/talents", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    }
  };

  if (loading || !isLoaded) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Edit Profile</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
        <div>
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
                {...register("first_name")}
              />
              {errors.first_name && (
                <FormError message={errors.first_name.message} />
              )}
            </div>

            <div>
              <RequiredLabel className={classLabel}>Last Name</RequiredLabel>
              <Input
                className={classInput}
                type="text"
                name="last_name"
                placeholder="Last name"
                {...register("last_name")}
              />
              {errors.last_name && (
                <FormError message={errors.last_name.message} />
              )}
            </div>
          </div>
        </div>

        {/* Industry Experience */}
        <div>
          <RequiredLabel className={classLabel}>
            Industry Experience
          </RequiredLabel>
          <Textarea
            className={classTextArea}
            {...register("industry_experience")}
            placeholder="e.g. 8 years in food & beverage..."
          />
          {errors.industry_experience && (
            <FormError message={errors.industry_experience.message} />
          )}
        </div>

        {/* Brand Experience */}
        <div>
          <TalentExperienceSection user_id={user?.id} showEdit={true} />
        </div>

        <div className="flex flex-col lg:flex-row gap-10 my-6">
          {/* Area of Specialization */}
          <div className="flex-1">
            <Controller
              name="area_of_specialization"
              control={control}
              defaultValue={[]}
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
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Other freeform specializations (already added by user) */}
                    {showOtherInput && (
                      <>
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
                              const isValid = OTHER_SCHEMA.test(trimmed);

                              if (!trimmed) {
                                setOtherSpecError(
                                  "Specialization cannot be empty."
                                );
                                return;
                              }
                              if (isDuplicate) {
                                setOtherSpecError(
                                  "This specialization has already been added."
                                );
                                return;
                              }
                              if (!isValid) {
                                setOtherSpecError(
                                  "Must be at least 3 characters and contain only letters, numbers, spaces.\nAllowed symbols: /, -, &, +, :, ., and ()"
                                );
                                return;
                              }

                              if (trimmed && !isDuplicate && isValid) {
                                field.onChange([...field.value, trimmed]);
                                setOtherSpec("");
                                setOtherSpecError("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {otherSpecError && (
                          <FormError message={otherSpecError} />
                        )}
                      </>
                    )}

                    {/* Show selected values as tags */}
                    <div className="flex flex-wrap gap-2 my-4">
                      {field.value.map((val, idx) => (
                        <span
                          key={idx}
                          className="flex items-center bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full"
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
                    <RequiredLabel className="mb-4 block">
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
                              ? "bg-teal-600 text-white border-transparent"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {errors.level_of_experience && (
                      <FormError message={errors.level_of_experience.message} />
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>

        {/* Links */}
        <div>
          <Label className={classLabel}>LinkedIn URL</Label>
          <Input
            className={classInput}
            type="url"
            placeholder="LinkedIn URL"
            {...register("linkedin_url")}
          />
          {errors.linkedin_url && (
            <FormError message={errors.linkedin_url.message} />
          )}
        </div>

        <div>
          <Label className={classLabel}>Website URL</Label>
          <Input
            className={classInput}
            type="url"
            placeholder="Website URL"
            {...register("portfolio_url")}
          />
          {errors.portfolio_url && (
            <FormError message={errors.portfolio_url.message} />
          )}
        </div>

        {/* Resume upload */}
        <div>
          <Label className={classLabel}>Resume</Label>
          {talentData?.resume_url && (
            <a
              href={talentData.resume_url}
              target="_blank"
              className="underline text-sm font-medium text-cpg-teal mb-4 block"
            >
              View Current Resume
            </a>
          )}
          <Input
            className={classInput}
            type="file"
            accept=".pdf,.doc,.docx"
            {...register("resume")}
          />
          {errors.resume && (
            <FormError message={errors.resume.message.toString()} />
          )}
        </div>

        {saveError && <p className="text-red-500">{saveError.message}</p>}

        {/* <button
          className="w-full bg-cpg-brown hover:bg-cpg-brown/90 cursor-pointer p-4"
          type="submit"
          disabled={savingTalent}
        >
          {savingTalent ? "Saving..." : "Save Changes"}
        </button> */}
        <Button
          variant="default"
          type="submit"
          size="lg"
          className="mt-4 bg-cpg-brown hover:bg-cpg-brown/90 cursor-pointer"
          disabled={savingTalent}
        >
          {savingTalent ? "Saving..." : "Save Changes"}
          {savingTalent && <Loader2Icon className="animate-spin h-6 w-6" />}
        </Button>
      </form>
    </div>
  );
};

export default EditTalentPage;
