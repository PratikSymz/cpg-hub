import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useWatch } from "react-hook-form";
import { BarLoader } from "react-spinners";
import useFetch from "@/hooks/use-fetch.jsx";
import { addNewService } from "@/api/apiServices.js";
import {
  categoryOfService,
  marketsCovered,
  typeOfBrokerService,
} from "@/constants/filters.js";
import clsx from "clsx";
import { ROLE_SERVICE } from "@/constants/roles.js";
import { ServiceSchema } from "@/schemas/service-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import { toTitleCase } from "@/utils/common-functions.js";
import { toast } from "sonner";
import RequiredLabel from "@/components/required-label.jsx";
import {
  classInput,
  classLabel,
  classTextArea,
} from "@/constants/classnames.js";
import FormError from "@/components/form-error.jsx";
import NumberInput from "@/components/number-input.jsx";
import DiscardChangesGuard from "@/components/discard-changes-guard.js";
import { ArrowLeft, X } from "lucide-react";

const ServiceOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const submittedRef = useRef(false); // Block duplicate submission

  const [otherCat, setOtherCat] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherCatError, setOtherCatError] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);

  const handleRoleSelection = async (role) => {
    const existingRoles = Array.isArray(user?.unsafeMetadata?.roles)
      ? user.unsafeMetadata.roles
      : [];

    if (existingRoles.includes(role)) {
      console.log(`Role "${role}" already present`);
      return;
    }

    const updatedRoles = [...existingRoles, role];

    try {
      await user.update({ unsafeMetadata: { roles: updatedRoles } });
      toast.success(`Role updated to: ${role}`);
      console.log(`Role updated to: ${role}`);
    } catch (err) {
      toast.error("Error updating role");
      console.error("Error updating role:", err);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onChange", // enables tracking dirty fields
    defaultValues: {
      area_of_specialization: "",
      category_of_service: [],
      type_of_broker_service: [],
      markets_covered: [],
    },
    resolver: zodResolver(ServiceSchema),
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

  const selectedCategories =
    useWatch({ control, name: "category_of_service" }) ?? [];

  const { func: submitBrokerProfile, loading, error } = useFetch(addNewService);

  const onSubmit = async (data) => {
    if (submittedRef.current) {
      console.warn("Duplicate submission prevented");
      return;
    }
    submittedRef.current = true;

    try {
      if (user && user.id) {
        const result = await submitBrokerProfile({
          is_broker: shouldShowBrokerServices,
          user_id: user.id,
          ...data,
        });

        // Check if useFetch detected an error
        if (result.error) {
          throw new Error(error.message || "Failed to create profile");
        }

        await handleRoleSelection(ROLE_SERVICE);
        navigate("/services", { replace: true });
        toast.success("Profile Created!");
        // window.location.reload();
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to create profile!");
      submittedRef.current = false; // allow resubmission if needed
    }
  };

  useEffect(() => {
    if (error) console.error("Submit Error:", error);
  }, [error]);

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  // Define what triggers the next field
  const shouldShowBrokerServices = selectedCategories.includes("Broker");
  const shouldShowMarketsCovered = selectedCategories.some((val) =>
    ["Broker", "Sales", "Merchandising"].includes(val)
  );

  return (
    <div>
      <div className="px-6">
        <Button
          className=""
          onClick={handleBackClick}
          variant="ghost"
          size="default"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hover:underline">Back</span>
        </Button>

        <DiscardChangesGuard
          show={showDialog}
          onDiscard={handleDiscard}
          onStay={handleStay}
        />
      </div>
      <h1 className="text-2xl lg:text-4xl font-bold text-center mb-10">
        Service Provider Onboarding
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
        <div>
          <RequiredLabel className={classLabel}>Company Name</RequiredLabel>
          <Input
            type="text"
            className={classInput}
            {...register("company_name")}
            placeholder="Finback Services"
          />
          {errors.company_name && (
            <FormError message={errors.company_name.message} />
          )}
        </div>

        <div>
          <Label className={classLabel}>Company Website</Label>
          <Input
            type="text"
            className={classInput}
            {...register("company_website")}
            placeholder="https://company.com"
          />
          {errors.company_website && (
            <FormError message={errors.company_website.message} />
          )}
        </div>

        <div>
          <Label className={classLabel}>Company Logo</Label>
          <Input
            type="file"
            accept="image/*"
            className="file:text-gray-500"
            {...register("logo")}
          />
          {errors.logo && (
            <FormError message={errors.logo.message.toString()} />
          )}
        </div>

        <div>
          <RequiredLabel className={classLabel}>About Service</RequiredLabel>
          <Textarea
            className={classTextArea}
            {...register("customers_covered")}
            placeholder="e.g. Tell us more about your service..."
          />
          {errors.customers_covered && (
            <FormError message={errors.customers_covered.message} />
          )}
        </div>

        <div>
          <RequiredLabel className={classLabel}>
            Number of Employees
          </RequiredLabel>
          <NumberInput
            placeholder="10"
            className={classInput}
            {...register("num_employees")}
          />
          {errors.num_employees && (
            <FormError message={"Please enter the number of employees"} />
          )}
        </div>

        <div>
          <RequiredLabel className={classLabel}>
            Area of Specialization
          </RequiredLabel>
          <Textarea
            className={classTextArea}
            {...register("area_of_specialization")}
            placeholder="e.g. Supply Chain, Packaging"
          />
          {errors.area_of_specialization && (
            <FormError message={errors.area_of_specialization.message} />
          )}
        </div>

        {/* Category of Service and Type of Broker Service */}
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-24 justify-around my-6">
          <div className="flex-1">
            <Controller
              name="category_of_service"
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
                    <RequiredLabel className={classLabel}>
                      Category of Service
                    </RequiredLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryOfService.map(({ label }) => (
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
                            value={otherCat}
                            onChange={(e) => setOtherCat(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            className=""
                            variant="default"
                            size="lg"
                            type="button"
                            onClick={() => {
                              const trimmed = toTitleCase(otherCat.trim());
                              // Check: valid string, not a duplicate (case-insensitive)
                              const isDuplicate = field.value.some(
                                (val) =>
                                  val.toLowerCase() === trimmed.toLowerCase()
                              );
                              // Min 3 letters, no special chars
                              const isValid = OTHER_SCHEMA.test(trimmed);

                              if (!trimmed) {
                                setOtherCatError(
                                  "Service category cannot be empty."
                                );
                                return;
                              }
                              if (isDuplicate) {
                                setOtherCatError(
                                  "This category has already been added."
                                );
                                return;
                              }
                              if (!isValid) {
                                setOtherCatError(
                                  "Must be at least 3 characters and contain only letters, numbers, spaces.\n Allowed symbols: /, -, &, +, :, ., and ()"
                                );
                                return;
                              }

                              if (trimmed && !isDuplicate && isValid) {
                                field.onChange([...field.value, trimmed]);
                                setOtherCat("");
                                setOtherCatError("");
                              }
                            }}
                          >
                            Add
                          </Button>
                          {otherCatError && (
                            <FormError message={otherCatError} />
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
                    {errors.category_of_service && (
                      <FormError message={errors.category_of_service.message} />
                    )}
                  </div>
                );
              }}
            />
          </div>

          {shouldShowBrokerServices && (
            <div className="flex-1">
              <Controller
                name="type_of_broker_service"
                control={control}
                render={({ field, formState }) => {
                  const toggleValue = (value) => {
                    const selected = field.value.includes(value);
                    const updated = selected
                      ? field.value.filter((v) => v !== value)
                      : [...field.value, value];
                    field.onChange(updated);
                  };

                  return (
                    <div>
                      <RequiredLabel className={classLabel}>
                        Type of Broker Service
                      </RequiredLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {typeOfBrokerService.map(({ label, value }) => (
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
              {errors.type_of_broker_service && (
                <FormError message={errors.type_of_broker_service.message} />
              )}
            </div>
          )}
        </div>

        {/* Markets Covered */}
        {shouldShowMarketsCovered && (
          <div className="flex flex-row gap-24 justify-around my-6">
            <Controller
              name="markets_covered"
              control={control}
              render={({ field, formState }) => {
                const toggleValue = (value) => {
                  const selected = field.value.includes(value);
                  const updated = selected
                    ? field.value.filter((v) => v !== value)
                    : [...field.value, value];
                  field.onChange(updated);
                };

                return (
                  <div className="flex-1">
                    <RequiredLabel className={classLabel}>
                      Markets covered (relevant to broker, sales, &
                      merchandisers)
                    </RequiredLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {marketsCovered.map(({ label, value }) => (
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
            {errors.markets_covered && (
              <FormError message={errors.markets_covered.message} />
            )}
          </div>
        )}

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

export default ServiceOnboarding;
