import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/clerk-react";
import useFetch from "@/hooks/use-fetch.jsx";
import { useNavigate } from "react-router-dom";
import { addNewTalent } from "@/api/apiTalent.js";
import { BarLoader } from "react-spinners";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { X } from "lucide-react";
import { ROLE_TALENT } from "@/constants/roles.js";
import { TalentSchema } from "@/schemas/talent-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import {
  classLabel,
  classInput,
  classTextArea,
} from "@/constants/classnames.js";
import { toast } from "sonner";

const TalentOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const imageUrl = user?.imageUrl;
  const fullName = user?.fullName;

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSpecError, setOtherSpecError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      level_of_experience: [],
      industry_experience: "",
      area_of_specialization: [],
      linkedin_url: "",
      portfolio_url: "",
    },
    resolver: zodResolver(TalentSchema),
  });

  const { func: submitTalentProfile, loading, error } = useFetch(addNewTalent);

  const handleRoleSelection = async (role) => {
    try {
      if (user) {
        await user.update({ unsafeMetadata: { role } });
      }
      toast.success(`Role updated to: ${role}`);
      console.log(`Role updated to: ${role}`);
    } catch (err) {
      toast.error("Error updating role");
      console.error("Error updating role:", err);
    }
  };

  const onSubmit = async (data) => {
    try {
      await handleRoleSelection(ROLE_TALENT);

      if (user && user.id) {
        await submitTalentProfile({
          ...data,
          user_id: user.id,
        });
      }
      toast.success("Profile Created!");
      navigate("/talents");
    } catch (err) {
      console.log(err);
      toast.error("Failed to create profile!");
    }
  };

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="flex flex-col gap-10 mt-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <img
            src={imageUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full border object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-black/90">{fullName}</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
        <div>
          <Label className={classLabel}>Upload Resume</Label>
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
            <FormError message={errors.industry_experience?.message} />
          )}
        </div>

        {/* Brand Experience */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Brand I've Worked With</h2>
          <p className="text-muted-foreground text-base whitespace-pre-line">
            Add your basic profile info first to continue adding brand
            experiences.
          </p>
          {/* <TalentExperienceSection user_id={user?.id} showEdit={true} /> */}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 my-6">
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
                                  "Must be at least 3 characters and contain only letters, numbers, spaces.\n Allowed symbols: /, -, &, +, :, ., and ()"
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
                          {otherSpecError && (
                            <FormError message={otherSpecError} />
                          )}
                        </div>
                      </>
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
            type="text"
            className={classInput}
            {...register("linkedin_url")}
            placeholder="https://linkedin.com/in/your-profile"
          />
          {errors.linkedin_url && (
            <FormError message={errors.linkedin_url.message} />
          )}
        </div>

        <div>
          <Label className={classLabel}>Website URL</Label>
          <Input
            type="text"
            className={classInput}
            {...register("portfolio_url")}
            placeholder="https://yourwebsite.com"
          />
          {errors.portfolio_url && (
            <FormError message={errors.portfolio_url.message} />
          )}
        </div>

        {error && <FormError message={error.message} />}

        <Button
          variant="default"
          type="submit"
          size="lg"
          className="mt-4 bg-cpg-brown hover:bg-cpg-brown/90"
        >
          Submit Profile
        </Button>
      </form>
    </div>
  );
};

export default TalentOnboarding;
