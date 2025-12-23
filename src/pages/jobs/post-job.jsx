import React, { useRef, useState } from "react";
import { addNewJob } from "@/api/apiFractionalJobs.js";
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
import useFetch from "@/hooks/use-fetch.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import {
  areasOfSpecialization,
  levelsOfExperience,
} from "@/constants/filters.js";
import clsx from "clsx";
import { X } from "lucide-react";
import { JobSchema } from "@/schemas/job-schema.js";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import {
  classLabel,
  classInput,
  classTextArea,
} from "@/constants/classnames.js";
import { toast } from "sonner";
import NumberInput from "@/components/number-input.jsx";

const PostJob = () => {
  // Load the current user -> Brand
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const submittedRef = useRef(false); // Block duplicate submission

  const [otherSpec, setOtherSpec] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

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
      work_location: "Remote",
      scope_of_work: "Ongoing",
      area_of_specialization: [],
      estimated_hrs_per_wk: "",
    },
    resolver: zodResolver(JobSchema),
  });

  const {
    loading: loadingCreateJob,
    error: errorCreateJob,
    data: dataCreateJob,
    func: funcCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = async (data) => {
    if (submittedRef.current) {
      console.warn("Duplicate submission prevented");
      return;
    }
    submittedRef.current = true;

    try {
      if (user && user.id) {
        const result = await funcCreateJob({
          ...data,
          brand_id: user.id,
          is_open: true,
        });

        // Check if useFetch detected an error
        if (result.error) {
          throw new Error(errorCreateJob.message || "Failed to create job");
        }

        navigate("/jobs", { replace: true });
        toast.success("Job created successfully!");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to create job!");
      submittedRef.current = false; // allow resubmission if needed
    }
  };

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

  // if (user && isLoaded && user?.unsafeMetadata?.role !== ROLE_BRAND) {
  //   return <Navigate to="/jobs" />;
  // }

  const toTitleCase = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <div className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      <h1 className="gradient-title font-extrabold text-4xl sm:text-6xl text-center pb-8">
        Post a Job
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-self-center gap-4"
      >
        {/* Job title */}
        <div>
          <RequiredLabel className={classLabel}>Job Title</RequiredLabel>
          <Input
            placeholder="Job Title"
            type="text"
            className={classInput}
            {...register("job_title")}
          />
          {errors.job_title && <FormError message={errors.job_title.message} />}
        </div>

        {/* Job Description upload */}
        <div>
          <Label className={classLabel}>Upload Job Description</Label>
          <Input
            className={classInput}
            type="file"
            accept=".pdf"
            {...register("job_description")}
          />
          {errors.job_description && (
            <FormError message={errors.job_description.message.toString()} />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 justify-around my-6">
          {/* Scope of Work */}
          <div className="flex-1">
            <RequiredLabel className={classLabel}>Scope of Work</RequiredLabel>
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
            <RequiredLabel className={classLabel}>Work Location</RequiredLabel>
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

        {errorCreateJob?.message && (
          <FormError message={errorCreateJob?.message} />
        )}

        {loadingCreateJob && <BarLoader width={"100%"} color="#36d7b7" />}
        <Button
          type="submit"
          variant="default"
          size="lg"
          className="mt-12 bg-cpg-brown hover:bg-cpg-brown/90"
        >
          Submit
        </Button>
      </form>
    </div>
  );
};

export default PostJob;
