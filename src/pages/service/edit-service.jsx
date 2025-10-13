// EditServicePage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  deleteService,
  getMyServiceProfile,
  updateService,
} from "@/api/apiServices.js";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { BarLoader } from "react-spinners";
import clsx from "clsx";
import {
  categoryOfService,
  marketsCovered,
  typeOfBrokerService,
} from "@/constants/filters.js";
import { Loader2Icon, X } from "lucide-react";
import { ServiceSchemaWithName } from "@/schemas/service-schema.js";
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
import { ArrowLeft } from "lucide-react";

const EditServicePage = () => {
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef(null);
  const [profileLoad, showProfileLoad] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const navigate = useNavigate();

  const [otherCat, setOtherCat] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherCatError, setOtherCatError] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      company_name: "",
      company_website: "",
      logo: undefined,
      num_employees: "",
      area_of_specialization: "",
      category_of_service: [],
      type_of_broker_service: [],
      markets_covered: [],
      customers_covered: "",
    },
    resolver: zodResolver(ServiceSchemaWithName),
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

  const {
    data: serviceData,
    loading,
    func: fetchService,
  } = useFetch(getMyServiceProfile);

  const {
    func: saveService,
    loading: savingService,
    error: saveError,
  } = useFetch(updateService);

  const {
    func: removeService,
    loading: removingService,
    error: removeError,
  } = useFetch(deleteService);

  const selectedCategories = useWatch({ control, name: "category_of_service" });
  const shouldShowBrokerServices = selectedCategories.includes("Broker");
  const shouldShowMarketsCovered = selectedCategories?.some((val) =>
    ["Broker", "Sales", "Merchandising"].includes(val)
  );

  useEffect(() => {
    if (isLoaded && user && user?.id) {
      fetchService({ user_id: user.id });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (serviceData) {
      setValue("first_name", user.firstName || "");
      setValue("last_name", user.lastName || "");
      setValue("company_name", serviceData.company_name || "");
      setValue("company_website", serviceData.company_website || "");
      setValue(
        "area_of_specialization",
        serviceData.area_of_specialization || ""
      );
      setValue("category_of_service", serviceData.category_of_service || []);
      setValue("markets_covered", serviceData.markets_covered || []);
      setValue(
        "type_of_broker_service",
        serviceData.type_of_broker_service || []
      );
      setValue("customers_covered", serviceData.customers_covered || "");
      setValue("num_employees", serviceData.num_employees ?? ""); // use ?? for 0
      if (serviceData.logo_url) setLogoPreview(serviceData.logo_url);
    }
  }, [serviceData]);

  useEffect(() => {
    if (!shouldShowBrokerServices) {
      setValue("type_of_broker_service", []);
    }
    if (!shouldShowMarketsCovered) {
      setValue("markets_covered", []);
    }
  }, [shouldShowBrokerServices, shouldShowMarketsCovered]);

  const handleProfilePictureClick = () => fileInputRef.current.click();

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showProfileLoad(true);
      await user.setProfileImage({ file });
      toast.success("Profile picture updated!");
      showProfileLoad(false);
    } catch (err) {
      toast.error("Failed to update profile picture.");
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;

    const ok = window.confirm("Are you sure you want to delete your profile?");
    if (!ok) return;

    try {
      const deleted = await removeService({ user_id: user.id });
      toast.success("Profile deleted.");
      navigate("/services", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete your profile.");
    }
  };

  const onSubmit = async (data) => {
    const firstName = data.first_name;
    const lastName = data.last_name;

    try {
      if (firstName !== user?.firstName || lastName !== user?.lastName) {
        await user.update({ firstName, lastName });
      }

      if (user && user.id) {
        await saveService(
          {
            ...data,
            is_broker: shouldShowBrokerServices,
            type_of_broker_service: shouldShowBrokerServices
              ? data.type_of_broker_service || []
              : [], // ← forcefully empty if broker not selected
            user_id: user.id,
          },
          { user_id: user.id }
        );
      }
      toast.success("Service profile updated!");
      navigate("/services", { replace: true });
    } catch (err) {
      console.log(err);
      toast.error("Failed to update service profile.");
    }
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
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
      <h1 className="text-4xl font-bold mb-6">Edit Service Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Profile Picture */}
        <div className="flex gap-6 items-center my-4">
          <img
            src={user.imageUrl}
            alt="Profile"
            className="h-24 w-24 rounded-full border object-cover cursor-pointer"
            onClick={handleProfilePictureClick}
          />
          {profileLoad && <Loader2Icon className="animate-spin h-6 w-6" />}

          <div>
            <p className="font-semibold">
              {user.primaryEmailAddress.emailAddress}
            </p>
            <p className="text-sm text-gray-500">(Click image to update)</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureChange}
            className="hidden"
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <RequiredLabel className={classLabel}>First Name</RequiredLabel>
            <Input
              className={classInput}
              type="text"
              placeholder="First name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <FormError message={errors.first_name.message} />
            )}
          </div>
          <div>
            <RequiredLabel className={classLabel}>Last Name</RequiredLabel>
            <Input
              className={classInput}
              type="text"
              placeholder="Last name"
              {...register("last_name")}
            />
            {errors.last_name && (
              <FormError message={errors.last_name.message} />
            )}
          </div>
        </div>

        {/* Company Name */}
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

        {/* Company Website */}
        <div>
          <Label className={classLabel}>Company Website</Label>
          <Input
            type="url"
            className={classInput}
            {...register("company_website")}
            placeholder="https://company.com"
          />
          {errors.company_website && (
            <FormError message={errors.company_website.message} />
          )}
        </div>

        {/* Company Logo */}
        <div>
          <Label className={classLabel}>Company Logo</Label>
          {logoPreview && (
            <div className="mb-4">
              <img
                src={logoPreview}
                alt="Current Logo"
                className="h-24 w-24 aspect-3/2 object-contain rounded border scale-100"
              />
            </div>
          )}
          <Input
            className={classInput}
            type="file"
            accept="image/*"
            {...register("logo")}
          />

          {errors.logo && (
            <FormError message={errors.logo.message.toString()} />
          )}
        </div>

        <div>
          <Label className={classLabel}>About</Label>
          <Textarea
            className={classTextArea}
            {...register("customers_covered")}
            placeholder="e.g. Tell us more about your service..."
          />
          {errors.customers_covered && (
            <FormError message={errors.customers_covered.message} />
          )}
        </div>

        {/* Num Employees */}
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

        {/* Area of Specialization */}
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
          {/* Category of Service */}
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
                              ? "bg-cpg-teal text-white border-transparent"
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

          {/* Type of Broker Service */}
          {shouldShowBrokerServices && (
            <div className="flex-1">
              <Controller
                name="type_of_broker_service"
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
                        Type of Broker Service
                      </RequiredLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {typeOfBrokerService.map(({ label }) => (
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
              render={({ field }) => {
                const toggleValue = (value) => {
                  const updated = field.value.includes(value)
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
                      {marketsCovered.map(({ label }) => (
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

        {saveError && <FormError message={saveError.message} />}
        {removeError && <p className="text-red-500">{removeError.message}</p>}

        <Button
          variant="default"
          type="submit"
          size="lg"
          className="mt-4 bg-cpg-brown hover:bg-cpg-brown/90"
          disabled={savingService || removingService}
        >
          {savingService ? "Saving..." : "Save Changes"}
        </Button>

        <Button
          variant="default"
          type="button"
          size="lg"
          className="bg-red-600 hover:bg-red-700 cursor-pointer"
          disabled={removingService}
          onClick={handleDelete}
        >
          {removingService ? "Deleting..." : "Delete Profile"}
          {removingService && <Loader2Icon className="animate-spin h-6 w-6" />}
        </Button>
      </form>
    </div>
  );
};

export default EditServicePage;
