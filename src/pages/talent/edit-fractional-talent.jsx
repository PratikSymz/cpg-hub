import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  deleteTalentById,
  getTalent,
  updateTalentById,
} from "@/api/apiTalent.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";
import { Send, Trash2, X, Users } from "lucide-react";
import TalentExperienceSection from "@/components/experience-section.jsx";
import { TalentSchema } from "@/schemas/talent-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import DiscardChangesGuard from "@/components/discard-changes-guard.js";
import BackButton from "@/components/back-button.jsx";
import { toTitleCase } from "@/utils/common-functions.js";
import { ADMIN_USER_IDS } from "@/constants/admins.js";

const isAdmin = (userId) => ADMIN_USER_IDS.includes(userId);

const EditTalentPage = () => {
  const { id } = useParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      level_of_experience: [],
      industry_experience: "",
      area_of_specialization: [],
      linkedin_url: "",
      portfolio_url: "",
    },
    resolver: zodResolver(TalentSchema),
  });

  const {
    func: fetchTalent,
    data: talentData,
    loading,
  } = useFetch(getTalent);

  const {
    func: saveTalent,
    loading: savingTalent,
    error: saveError,
  } = useFetch(updateTalentById);

  const {
    func: removeTalent,
    loading: removingTalent,
    error: removeError,
  } = useFetch(deleteTalentById);

  // Load talent profile by ID from URL
  useEffect(() => {
    if (isLoaded && id) {
      fetchTalent({ talent_id: id });
    }
  }, [isLoaded, id]);

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSpecError, setOtherSpecError] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);

  // Profile info from fetched talent data
  const userInfo = talentData?.user_info;
  const profileName = userInfo?.full_name || "Unknown";
  const profileEmail = userInfo?.email || "";
  const profileImage = userInfo?.profile_picture_url || "";

  // Prefill form when data loads
  useEffect(() => {
    if (talentData) {
      setValue("level_of_experience", talentData.level_of_experience || []);
      setValue("industry_experience", talentData.industry_experience || "");
      setValue(
        "area_of_specialization",
        talentData.area_of_specialization || []
      );
      setValue("linkedin_url", talentData.linkedin_url || "");
      setValue("portfolio_url", talentData.portfolio_url || "");
    }
  }, [talentData, setValue]);

  // Check if current user can edit this profile
  const canEdit =
    isSignedIn &&
    (userInfo?.user_id === user?.id || isAdmin(user?.id));

  const handleDelete = async () => {
    if (!id) return;

    const ok = window.confirm("Are you sure you want to delete this profile?");
    if (!ok) return;

    try {
      await removeTalent({ talent_id: id });
      toast.success("Profile deleted.");
      navigate("/talents", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete profile.");
    }
  };

  const onSubmit = async (data) => {
    const combinedAreaOfSpec = otherSpec
      ? [...data.area_of_specialization, otherSpec]
      : data.area_of_specialization;

    try {
      if (id) {
        await saveTalent(
          {
            ...data,
            area_of_specialization: combinedAreaOfSpec,
            resume_url: talentData.resume_url,
          },
          { talent_id: id }
        );
      }

      toast.success("Profile Updated!");
      navigate(`/talents/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    }
  };

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

  if (loading || !isLoaded) {
    return <BarLoader width={"100%"} color="#00A19A" />;
  }

  if (!talentData) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">Talent profile not found.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">You don't have permission to edit this profile.</p>
      </div>
    );
  }

  return (
    <main className="py-10">
      {/* Header Section */}
      <section className="w-5/6 mx-auto mb-8">
        <BackButton />
        <div className="flex items-center justify-center gap-3 mb-4 mt-6">
          <div className="bg-cpg-teal/10 rounded-xl p-3">
            <Users className="h-6 w-6 text-cpg-teal" />
          </div>
        </div>
        <h1 className="gradient-title font-extrabold text-3xl sm:text-4xl text-center">
          Edit Talent Profile
        </h1>
        <p className="text-center text-muted-foreground mt-3 max-w-lg mx-auto">
          Update the profile information below.
        </p>
      </section>

      <DiscardChangesGuard
        show={showDialog}
        onDiscard={handleDiscard}
        onStay={handleStay}
      />

      {/* Profile Card - Shows whose profile is being edited */}
      <section className="w-5/6 max-w-3xl mx-auto mb-8">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-cpg-teal/10 flex items-center justify-center">
                <span className="text-cpg-teal font-semibold text-xl">
                  {profileName?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profileName}</h2>
              <p className="text-sm text-muted-foreground">{profileEmail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Card */}
      <section className="w-5/6 max-w-3xl mx-auto">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Industry Experience */}
            <div>
              <RequiredLabel className="text-sm font-medium text-gray-700 mb-2 block">
                Industry Experience
              </RequiredLabel>
              <Textarea
                {...register("industry_experience")}
                placeholder="e.g. 8 years in food & beverage, specializing in product development and brand strategy..."
                rows={4}
                className="rounded-xl border-gray-200 focus:border-cpg-teal focus:ring-cpg-teal/20"
              />
              {errors.industry_experience && (
                <FormError message={errors.industry_experience?.message} />
              )}
            </div>

            {/* Brand Experience */}
            <div className="bg-gray-50 rounded-xl p-4">
              <TalentExperienceSection user_id={userInfo?.user_id} showEdit={true} />
            </div>

            {/* Area of Specialization */}
            <div>
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
                      <RequiredLabel className="text-sm font-medium text-gray-700 mb-3 block">
                        Area of Specialization
                      </RequiredLabel>
                      <div className="flex flex-wrap gap-2">
                        {areasOfSpecialization.map(({ label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleValue(label)}
                            className={clsx(
                              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                              field.value.includes(label)
                                ? "bg-cpg-teal text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Other input box */}
                      {showOtherInput && (
                        <div className="mt-4">
                          <div className="flex gap-2 items-center">
                            <Input
                              type="text"
                              placeholder="Enter your specialization"
                              value={otherSpec}
                              onChange={(e) => setOtherSpec(e.target.value)}
                              className="flex-1 h-11 rounded-xl"
                            />
                            <Button
                              variant="default"
                              size="default"
                              type="button"
                              className="h-11 rounded-xl bg-cpg-teal hover:bg-cpg-teal/90"
                              onClick={() => {
                                const trimmed = toTitleCase(otherSpec.trim());
                                const isDuplicate = field.value.some(
                                  (val) =>
                                    val.toLowerCase() === trimmed.toLowerCase()
                                );
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
                                    "Must be at least 3 characters and contain only letters, numbers, spaces."
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
                        </div>
                      )}

                      {/* Show selected values as tags */}
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {field.value.map((val, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-cpg-teal/10 text-cpg-teal px-3 py-1.5 rounded-full text-sm font-medium"
                            >
                              {val}
                              <button
                                type="button"
                                onClick={() => removeValue(val)}
                                className="hover:text-red-500 ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
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
            <div>
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
                      <RequiredLabel className="text-sm font-medium text-gray-700 mb-3 block">
                        Level of Experience
                      </RequiredLabel>
                      <div className="flex flex-wrap gap-2">
                        {levelsOfExperience.map(({ label }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => toggleValue(label)}
                            className={clsx(
                              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                              field.value.includes(label)
                                ? "bg-cpg-brown text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

            {/* Links Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  LinkedIn URL
                </Label>
                <Input
                  type="text"
                  {...register("linkedin_url")}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="h-12 rounded-xl border-gray-200"
                />
                {errors.linkedin_url && (
                  <FormError message={errors.linkedin_url.message} />
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Website URL
                </Label>
                <Input
                  type="text"
                  {...register("portfolio_url")}
                  placeholder="https://yourwebsite.com"
                  className="h-12 rounded-xl border-gray-200"
                />
                {errors.portfolio_url && (
                  <FormError message={errors.portfolio_url.message} />
                )}
              </div>
            </div>

            {/* Resume */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Resume
              </Label>
              {talentData?.resume_url && (
                <a
                  href={talentData.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cpg-teal hover:underline text-sm font-medium mb-2 block"
                >
                  View Current Resume
                </a>
              )}
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                {...register("resume")}
                className="file:text-gray-500"
              />
              {errors.resume && (
                <FormError message={errors.resume.message.toString()} />
              )}
            </div>

            {saveError && <FormError message={saveError.message} />}
            {removeError && <FormError message={removeError.message} />}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                variant="default"
                type="submit"
                size="lg"
                disabled={savingTalent}
                className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl"
              >
                <Send className="h-5 w-5 mr-2" />
                {savingTalent ? "Saving Changes..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                type="button"
                size="lg"
                disabled={removingTalent}
                onClick={handleDelete}
                className="w-full h-14 text-base rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {removingTalent ? "Deleting..." : "Delete Profile"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default EditTalentPage;
