import { getBrand } from "@/api/apiBrands.js";
import { addNewJob } from "@/api/apiFractionalJobs.js";
import { Button } from "@/components/ui/button.jsx";

import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { ROLE_BRAND, ROLE_TALENT } from "@/constants/roles.js";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { X } from "lucide-react";

const schema = z.object({
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
    (a) => parseInt(z.string().parse(a), 10),
    z.number().lte(40, "Must be 40 or below")
  ),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Select at least one specialization"),
});

const PostJob = () => {
  // Load the current user -> Brand
  const { user, isLoaded } = useUser();

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      preferred_experience: "",
      level_of_experience: [],
      job_title: "",
      area_of_specialization: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    func: funcCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = (data) => {
    funcCreateJob({
      ...data,
      brand_id: user.id,
      is_open: true,
    });
  };

  useEffect(() => {
    if (dataCreateJob?.length > 0) navigate("/jobs");
  }, [loadingCreateJob]);

  // // Load the current brand info
  // const {
  //   loading: loadingBrand,
  //   data: dataBrand,
  //   func: funcBrand,
  // } = useFetch(getBrand, {
  //   id: user.id,
  // });

  // useEffect(() => {
  //   if (isLoaded) {
  //     funcBrand();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isLoaded]);

  // if (!isLoaded || loadingBrand) {
  //   return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  // }

  if (user?.unsafeMetadata?.role !== ROLE_BRAND) {
    return <Navigate to="/jobs" />;
  }

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div>
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        Post a Job
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col w-5/6 justify-self-center gap-4 m-6 pb-0"
      >
        {/* Job title */}
        <Input
          placeholder="Job Title"
          type="text"
          className="input-class"
          {...register("job_title")}
        />
        {errors.job_title && (
          <p className="text-sm text-red-500">{errors.job_title.message}</p>
        )}

        <div className="flex flex-row gap-16 justify-around my-6">
          {/* Scope of Work */}
          <div className="flex-1">
            <Label className="mb-4 block">Scope of Work</Label>
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
              <p className="text-sm text-red-500">
                {errors.scope_of_work.message}
              </p>
            )}
          </div>

          {/* Work Location */}
          <div className="flex-1">
            <Label className="mb-4 block">Work Location</Label>
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
                  </SelectContent>
                </Select>
              )}
            />
            {errors.work_location && (
              <p className="text-sm text-red-500">
                {errors.work_location.message}
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
              {...register("estimated_hrs_per_wk")}
            />
            {errors.estimated_hrs_per_wk && (
              <p className="text-sm text-red-500">
                {errors.estimated_hrs_per_wk.message}
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

        {/* Preferred Experience */}
        <div>
          <Label className="mb-4 block">Preferred Experience</Label>
          <Textarea
            placeholder="Preferred Experience"
            className="textarea-class resize block w-full h-24"
            {...register("preferred_experience")}
          />
          {errors.preferred_experience && (
            <p className="text-sm text-red-500">
              {errors.preferred_experience.message}
            </p>
          )}
        </div>

        {/* <div className="flex gap-4 items-center">
          <Controller
            name="company_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="">
                  <SelectValue placeholder="Company">
                    {field.value
                      ? companies?.find((com) => com.id === Number(field.value))
                          ?.name
                      : "Company"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="">
                  <SelectGroup>
                    {companies?.map(({ name, id }) => (
                      <SelectItem className="" key={name} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
          <AddCompanyDrawer fetchCompanies={fnCompanies} />
        </div>
        {errors.company_id && (
          <p className="text-red-500">{errors.company_id.message}</p>
        )} */}

        {errorCreateJob?.message && (
          <p className="text-sm text-red-500">{errorCreateJob?.message}</p>
        )}
        {loadingCreateJob && <BarLoader width={"100%"} color="#36d7b7" />}
        <Button type="submit" variant="default" size="lg" className="mt-12 bg-cpg-brown hover:bg-cpg-brown/90">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
