import { getCompanies } from "@/api/apiCompanies.js";
import { addNewJob } from "@/api/apiFractionalJobs.js";
import AddCompanyDrawer from "@/components/add-company-drawer.jsx";
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
import { ROLE_TALENT } from "@/constants/roles.js";
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { State } from "country-state-city";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { z } from "zod";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";

const schema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  scopeOfWork: z.enum(["Project-based", "Ongoing"], {
    message: "Select a scope of work",
  }),
  workLocation: z.enum(["Remote", "In-office"], {
    message: "Select a work location",
  }),
  areaOfSpec: z.array(z.string()).min(1, "Select at least one specialization"),
  levelOfExp: z.array(z.string()).min(1, "Select at least one level"),
  estimatedHrs: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().lte(40, "Must be 40 or below")
  ),
  preferredExp: z
    .string()
    .min(1, { message: "Preferred experience is required" }),

  company_id: z.string().min(1, { message: "Select or Add a new Company" }),
});

const PostJob = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      areaOfSpec: [],
      levelOfExp: [],
      company_id: "",
      preferredExp: "",
    },
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = (data) => {
    fnCreateJob({
      ...data,
      recruiter_id: user.id,
      isOpen: true,
    });
  };

  useEffect(() => {
    if (dataCreateJob?.length > 0) navigate("/jobs");
  }, [loadingCreateJob]);

  const {
    loading: loadingCompanies,
    data: companies,
    func: fnCompanies,
  } = useFetch(getCompanies);

  useEffect(() => {
    if (isLoaded) {
      fnCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!isLoaded || loadingCompanies) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (user?.unsafeMetadata?.role === ROLE_TALENT) {
    return <Navigate to="/jobs" />;
  }

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
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}

        <div className="flex flex-row gap-16 justify-around my-6">
          {/* Scope of Work */}
          <div className="flex-1">
            <Label className="mb-4 block">Scope of Work</Label>
            <Controller
              control={control}
              name="scopeOfWork"
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
            {errors.scopeOfWork && (
              <p className="text-sm text-red-500">
                {errors.scopeOfWork.message}
              </p>
            )}
          </div>

          {/* Work Location */}
          <div className="flex-1">
            <Label className="mb-4 block">Work Location</Label>
            <Controller
              control={control}
              name="workLocation"
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
            {errors.workLocation && (
              <p className="text-sm text-red-500">
                {errors.workLocation.message}
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
              {...register("estimatedHrs")}
            />
            {errors.estimatedHrs && (
              <p className="text-sm text-red-500">
                {errors.estimatedHrs.message}
              </p>
            )}
          </div>
        </div>

        {/* Area of Spec and Level of Exp */}
        <div className="flex flex-row gap-24 justify-around my-6">
          <div className="flex-1">
            <Controller
              name="areaOfSpec"
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
                  <div>
                    <Label className="mb-4 block">Area of Specialization</Label>
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
                  </div>
                );
              }}
            />
            {errors.areaOfSpec && (
              <p className="text-sm text-red-500">
                {errors.areaOfSpec.message}
              </p>
            )}
          </div>

          <div className="flex-1">
            <Controller
              name="levelOfExp"
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
                  <div>
                    <Label className="mb-4 block">Level of Experience</Label>
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
                  </div>
                );
              }}
            />
            {errors.areaOfSpec && (
              <p className="text-sm text-red-500">
                {errors.areaOfSpec.message}
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
            {...register("preferredExp")}
          />
          {errors.preferredExp && (
            <p className="text-sm text-red-500">
              {errors.preferredExp.message}
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
        <Button type="submit" variant="default" size="lg" className="mt-12">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
