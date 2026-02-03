import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addNewTalent } from "@/api/apiTalent.js";
import { BarLoader } from "react-spinners";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { Send, X, Users, Upload } from "lucide-react";
import { ROLE_TALENT } from "@/constants/roles.js";
import { TalentSchema } from "@/schemas/talent-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import { toTitleCase } from "@/utils/common-functions.js";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import { toast } from "sonner";
import DiscardChangesGuard from "@/components/discard-changes-guard.js";
import BackButton from "@/components/back-button.jsx";

const TalentOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submittedRef = useRef(false);
  const returnTo = searchParams.get("returnTo");

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const imageUrl = user?.imageUrl;
  const fullName = user?.fullName;

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSpecError, setOtherSpecError] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);

  const {
    register,
    handleSubmit,
    control,
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

  const { func: submitTalentProfile, loading, error } = useFetch(addNewTalent);

  const handleRoleSelection = async (role) => {
    const existingRoles = Array.isArray(user?.unsafeMetadata?.roles)
      ? user.unsafeMetadata.roles
      : [];

    if (existingRoles.includes(role)) {
      return;
    }

    const updatedRoles = [...existingRoles, role];

    try {
      await user.update({ unsafeMetadata: { roles: updatedRoles } });
      toast.success(`Role updated to: ${role}`);
    } catch (err) {
      toast.error("Error updating role");
      console.error("Error updating role:", err);
    }
  };

  const onSubmit = async (data) => {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;

    try {
      if (user && user.id) {
        const result = await submitTalentProfile({
          ...data,
          user_id: user.id,
        });

        if (result.error) {
          throw new Error(error.message || "Failed to create profile");
        }

        await handleRoleSelection(ROLE_TALENT);
        const redirectPath = returnTo || "/talents";
        navigate(redirectPath, { replace: true });
        toast.success("Profile Created!");
      }
    } catch (err) {
      console.error("Failed to create profile:", err);
      toast.error("Failed to create profile!");
      submittedRef.current = false;
    }
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#00A19A" />;
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
          Create Your Talent Profile
        </h1>
        <p className="text-center text-muted-foreground mt-3 max-w-lg mx-auto">
          Showcase your CPG expertise and connect with brands looking for fractional talent.
        </p>
      </section>

      <DiscardChangesGuard
        show={showDialog}
        onDiscard={handleDiscard}
        onStay={handleStay}
      />

      {/* Profile Card */}
      <section className="w-5/6 max-w-3xl mx-auto mb-8">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <img
              src={imageUrl}
              alt="Profile"
              className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Card */}
      <section className="w-5/6 max-w-3xl mx-auto">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Resume Upload */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Upload Resume
              </Label>
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

            {/* Brand Experience Note */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Brands I've Worked With
              </h3>
              <p className="text-sm text-muted-foreground">
                Add your basic profile info first to continue adding brand experiences.
              </p>
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

            {error && <FormError message={error.message} />}

            {/* Submit Button */}
            <Button
              variant="default"
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl mt-4"
            >
              <Send className="h-5 w-5 mr-2" />
              {loading ? "Creating Profile..." : "Create Profile"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default TalentOnboarding;
