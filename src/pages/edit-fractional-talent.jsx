import React from "react";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  getMyTalentProfile,
  updateTalent,
  deleteTalent,
} from "@/api/apiTalent.js";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Label } from "@radix-ui/react-label";

const schema = z.object({
  level_of_experience: z
    .array(z.string())
    .min(1, "Experience level is required")
    .optional(),
  industry_experience: z
    .string()
    .min(1, "Industry Experience is required")
    .optional(),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Area of specialization is required")
    .optional(),
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
    )
    .optional(),
});

const TalentEditProfile = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      level_of_experience: [],
      industry_experience: "",
      area_of_specialization: [],
      linkedin_url: "",
      portfolio_url: "",
    },
  });

  const {
    func: fetchTalent,
    data: talentData,
    loading: loadingTalent,
  } = useFetch(getMyTalentProfile);
  const { func: updateTalentProfile, loading: loadingUpdate } =
    useFetch(updateTalent);
  const { func: deleteTalentProfile, loading: loadingDelete } =
    useFetch(deleteTalent);

  useEffect(() => {
    if (isLoaded && user && user.id) {
      fetchTalent({ user_id: user.id });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (talentData) {
      reset({
        industry_experience: talentData.industry_experience || "",
        area_of_specialization:
          JSON.parse(talentData.area_of_specialization) || [],
        level_of_experience: JSON.parse(talentData.level_of_experience) || [],
        linkedin_url: talentData.linkedin_url || "",
        portfolio_url: talentData.portfolio_url || "",
      });
    }
  }, [talentData, reset]);

  const onSubmit = (formData) => {
    updateTalentProfile({
      ...formData,
      user_id: user.id,
    });
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your profile?"
    );
    if (confirmed) {
      await deleteTalentProfile({ user_id: user.id });
      navigate("/talents");
    }
  };

  if (!isLoaded || loadingTalent) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  const classLabel = "mb-1 block";
  const classInput = "input-class";

  return (
    <div className="px-6 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Edit Talent Profile
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
        {/* Industry Experience */}
        <div>
          <Label className={classLabel}>Industry Experience</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            placeholder="e.g. 8 years in food & beverage..."
            {...register("industry_experience")}
          />
          {errors.industry_experience && (
            <p className="text-red-500">{errors.industry_experience.message}</p>
          )}
        </div>

        {/* Area of Specialization */}
        <div>
          <Label className={classLabel}>Area of Specialization</Label>
          <Controller
            name="area_of_specialization"
            control={control}
            render={({ field }) => {
              const toggleValue = (value) => {
                const selected = field.value.includes(value);
                const updated = selected
                  ? field.value.filter((v) => v !== value)
                  : [...field.value, value];
                field.onChange(updated);
              };

              return (
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
              );
            }}
          />
        </div>

        {/* Level of Experience */}
        <div>
          <Label className={classLabel}>Level of Experience</Label>
          <Controller
            name="level_of_experience"
            control={control}
            render={({ field }) => {
              const toggleValue = (value) => {
                const selected = field.value.includes(value);
                const updated = selected
                  ? field.value.filter((v) => v !== value)
                  : [...field.value, value];
                field.onChange(updated);
              };

              return (
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
              );
            }}
          />
        </div>

        {/* LinkedIn URL */}
        <div>
          <Label className={classLabel}>LinkedIn URL</Label>
          <Input
            type="text"
            className={classInput}
            placeholder="https://linkedin.com/in/your-profile"
            {...register("linkedin_url")}
          />
        </div>

        {/* Portfolio URL */}
        <div>
          <Label className={classLabel}>Website URL</Label>
          <Input
            type="text"
            className={classInput}
            placeholder="https://yourwebsite.com"
            {...register("portfolio_url")}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          variant="default"
          className="mt-4 bg-cpg-teal hover:bg-cpg-teal/90"
        >
          {loadingUpdate ? "Updating..." : "Save Changes"}
        </Button>

        {/* Delete Button */}
        <Button
          type="button"
          size="lg"
          variant="destructive"
          className="mt-4"
          onClick={handleDelete}
        >
          {loadingDelete ? "Deleting..." : "Delete Profile"}
        </Button>
      </form>
    </div>
  );
};

export default TalentEditProfile;
