import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { getTalent, updateTalent } from "@/api/apiTalent.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(1, "Full Name is required"),
  level_of_experience: z
    .array(z.string())
    .min(1, "Level of experience required"),
  industry_experience: z.string().min(1, "Industry experience required"),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Select at least one area"),
  linkedin_url: z.string().url("Invalid URL").optional(),
  portfolio_url: z.string().url("Invalid URL").optional(),
  resume: z.any().optional(),
});

const EditTalentPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const { func: fetchTalent, data: talent, loading } = useFetch(getTalent);

  const {
    func: saveTalent,
    loading: saving,
    error: saveError,
  } = useFetch(updateTalent);

  const [otherSpec, setOtherSpec] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: "",
      level_of_experience: [],
      industry_experience: "",
      area_of_specialization: [],
      linkedin_url: "",
      portfolio_url: "",
      resume: undefined,
    },
    resolver: zodResolver(schema),
  });

  // Load talent profile
  useEffect(() => {
    if (isLoaded) {
      fetchTalent({ user_id: user.id });
    }
  }, [isLoaded]);

  // Prefill form
  useEffect(() => {
    if (talent) {
      setValue("full_name", user.fullName);
      setValue("level_of_experience", talent.level_of_experience ?? []);
      setValue("industry_experience", talent.industry_experience ?? "");
      setValue("area_of_specialization", talent.area_of_specialization ?? []);
      setValue("linkedin_url", talent.linkedin_url ?? "");
      setValue("portfolio_url", talent.portfolio_url ?? "");
    }
  }, [talent]);

  const onSubmit = async (data) => {
    const combinedAreaOfSpec = otherSpec
      ? [...data.area_of_specialization, otherSpec]
      : data.area_of_specialization;

    const nameParts = data.full_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    // Update Clerk first and last name if changed
    if (firstName !== user?.firstName || lastName !== user?.lastName) {
      await user.update({
        firstName,
        lastName,
      });
    }

    // Save Talent profile
    await saveTalent({
      user_id: user.id,
      ...data,
      area_of_specialization: combinedAreaOfSpec,
    });

    toast.success("Profile Updated!");
  };

  if (loading || !isLoaded) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Edit Your Talent Profile</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Pic + Full Name */}
        <div>
          <img
            src={user?.imageUrl}
            alt="Profile"
            className="h-24 w-24 rounded-full border object-cover mb-4"
          />
          <Input placeholder="Full Name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-red-500">{errors.full_name.message}</p>
          )}
        </div>

        {/* Industry Experience */}
        <div>
          <Textarea
            placeholder="Industry Experience"
            {...register("industry_experience")}
            className="resize-none"
          />
          {errors.industry_experience && (
            <p className="text-red-500">{errors.industry_experience.message}</p>
          )}
        </div>

        {/* Area of Specialization */}
        <div>
          <p className="font-medium mb-2">Area of Specialization</p>
          <Controller
            control={control}
            name="area_of_specialization"
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
                  {areasOfSpecialization.map(({ label, value }) => (
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
          {/* Other field */}
          <Input
            placeholder="Other (if any)"
            value={otherSpec}
            onChange={(e) => setOtherSpec(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Level of Experience */}
        <div>
          <p className="font-medium mb-2">Level of Experience</p>
          <Controller
            control={control}
            name="level_of_experience"
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
                  {levelsOfExperience.map(({ label, value }) => (
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

        {/* Links */}
        <Input placeholder="LinkedIn URL" {...register("linkedin_url")} />
        <Input placeholder="Portfolio URL" {...register("portfolio_url")} />

        {/* Resume upload */}
        <div>
          <p className="font-medium mb-2">Resume</p>
          {talent?.resume_url && (
            <a
              href={talent.resume_url}
              target="_blank"
              className="underline text-teal-600 mb-4 block"
            >
              View Current Resume
            </a>
          )}
          <Input type="file" {...register("resume")} />
        </div>

        {saveError && <p className="text-red-500">{saveError.message}</p>}

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-cpg-brown hover:bg-cpg-brown/90"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default EditTalentPage;
