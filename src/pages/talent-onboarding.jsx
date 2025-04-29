import React, { useState } from "react";
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

const schema = z.object({
  level_of_experience: z
    .array(z.string())
    .min(1, "Experience level is required"),
  industry_experience: z.string().min(1, "Industry Experience is required"),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Area of specialization is required"),
  linkedin_url: z.string().url("Must be a valid URL").optional(),
  portfolio_url: z.string().url("Must be a valid URL").optional(),
  resume: z
    .any()
    .refine(
      (file) =>
        file?.[0] &&
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file[0]?.type),
      {
        message: "Only PDF, DOC, or DOCX files are allowed",
      }
    ),
});

const classLabel = "mb-1 block";
const classInput = "input-class";

const TalentOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        console.log(`Role updated to: ${role}`);
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

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
    resolver: zodResolver(schema),
  });

  const {
    func: submitTalentProfile,
    loading,
    error,
    data,
  } = useFetch(addNewTalent);

  const onSubmit = (data) => {
    handleRoleSelection(ROLE_TALENT);
    submitTalentProfile({
      ...data,
      user_id: user.id,
    });
  };

  const selectedOther = useWatch({ control, name: "area_of_specialization" });
  // Define what triggers the next field
  // const shouldShowOtherInput = selectedOther?.some((val) =>
  //   ["Other"].includes(val)
  // );
  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (data) {
    navigate("/talents");
  }

  const email = user?.emailAddresses?.[0]?.emailAddress;
  const imageUrl = user?.imageUrl;
  const fullName = user?.fullName;

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

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
        </div>

        <div>
          <Label className={classLabel}>Industry Experience</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            {...register("industry_experience")}
            placeholder="e.g. 8 years in food & beverage..."
          />
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
                    <Label className="mb-4 block">Area of Specialization</Label>
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
                      {field.value.map((val, idx) => (
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
            {errors.area_of_specialization && (
              <p className="text-sm text-red-500">
                {errors.area_of_specialization.message}
              </p>
            )}
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
            {errors.level_of_experience && (
              <p className="text-sm text-red-500">
                {errors.level_of_experience.message}
              </p>
            )}
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
            <p className="text-sm text-red-500">
              {errors.linkedin_url.message}
            </p>
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
            <p className="text-sm text-red-500">
              {errors.portfolio_url.message}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error.message}</p>}

        <Button variant="default" type="submit" size="lg" className="mt-4">
          Submit Profile
        </Button>
      </form>
    </div>
  );
};

export default TalentOnboarding;
