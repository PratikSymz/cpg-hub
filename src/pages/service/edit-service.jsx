import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  getSingleService,
  updateServiceById,
  deleteServiceById,
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
import { Briefcase, Send, Trash2, X } from "lucide-react";
import { ServiceSchema } from "@/schemas/service-schema.js";
import { OTHER_SCHEMA } from "@/constants/schemas.js";
import { toTitleCase } from "@/utils/common-functions.js";
import { toast } from "sonner";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import NumberInput from "@/components/number-input.jsx";
import DiscardChangesGuard from "@/components/discard-changes-guard.js";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog.jsx";
import BackButton from "@/components/back-button.jsx";
import { isAdminEmail } from "@/constants/admins.js";

const EditServicePage = () => {
  const { id } = useParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  const [logoPreview, setLogoPreview] = useState("");
  const [otherCat, setOtherCat] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherCatError, setOtherCatError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onChange",
    defaultValues: {
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
    resolver: zodResolver(ServiceSchema),
  });

  const {
    data: serviceData,
    loading,
    func: fetchService,
  } = useFetch(getSingleService);

  const {
    func: saveService,
    loading: savingService,
    error: saveError,
  } = useFetch(updateServiceById);

  const {
    func: removeService,
    loading: removingService,
    error: removeError,
  } = useFetch(deleteServiceById);

  const selectedCategories = useWatch({ control, name: "category_of_service" });
  const shouldShowBrokerServices = selectedCategories?.includes("Broker");
  const shouldShowMarketsCovered = selectedCategories?.some((val) =>
    ["Broker", "Sales", "Merchandising"].includes(val)
  );

  // Load service profile by ID from URL
  useEffect(() => {
    if (isLoaded && id) {
      fetchService({ broker_id: id });
    }
  }, [isLoaded, id]);

  // Prefill form when data loads
  useEffect(() => {
    if (serviceData) {
      setValue("company_name", serviceData.company_name || "");
      setValue("company_website", serviceData.company_website || "");
      setValue("area_of_specialization", serviceData.area_of_specialization || "");
      setValue("category_of_service", serviceData.category_of_service || []);
      setValue("markets_covered", serviceData.markets_covered || []);
      setValue("type_of_broker_service", serviceData.type_of_broker_service || []);
      setValue("customers_covered", serviceData.customers_covered || "");
      setValue("num_employees", serviceData.num_employees ?? "");
      if (serviceData.logo_url) setLogoPreview(serviceData.logo_url);
    }
  }, [serviceData, setValue]);

  // Clear conditional fields when conditions change
  useEffect(() => {
    if (!shouldShowBrokerServices) {
      setValue("type_of_broker_service", []);
    }
    if (!shouldShowMarketsCovered) {
      setValue("markets_covered", []);
    }
  }, [shouldShowBrokerServices, shouldShowMarketsCovered, setValue]);

  // Profile info from fetched service data
  const userInfo = serviceData?.user_info;
  const profileName = userInfo?.full_name || serviceData?.company_name || "Unknown";
  const profileEmail = userInfo?.email || "";
  const profileImage = userInfo?.profile_picture_url || "";

  // Check if current user can edit this profile
  const canEdit =
    isSignedIn &&
    (userInfo?.user_id === user?.id || isAdminEmail(user?.primaryEmailAddress?.emailAddress));

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

  const handleDeleteClick = () => {
    if (!id) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await removeService({ service_id: id });
      toast.success("Profile deleted.");
      navigate("/services", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete profile.");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (id) {
        await saveService(
          {
            ...data,
            is_broker: shouldShowBrokerServices,
            type_of_broker_service: shouldShowBrokerServices
              ? data.type_of_broker_service || []
              : [],
            logo_url: serviceData.logo_url,
          },
          { service_id: id }
        );
      }

      toast.success("Service profile updated!");
      navigate(`/services/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update service profile.");
    }
  };

  if (loading || !isLoaded) {
    return <BarLoader width={"100%"} color="#00A19A" />;
  }

  if (!serviceData) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">Service profile not found.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">You don't have permission to edit this profile.</p>
      </div>
    );
  }

  return (
    <main className="py-10">
      {/* Header Section */}
      <section className="w-5/6 mx-auto mb-8">
        <BackButton />
        <div className="flex items-center justify-center gap-3 mb-4 mt-6">
          <div className="bg-cpg-teal/10 rounded-xl p-3">
            <Briefcase className="h-6 w-6 text-cpg-teal" />
          </div>
        </div>
        <h1 className="gradient-title font-extrabold text-3xl sm:text-4xl text-center">
          Edit Service Profile
        </h1>
        <p className="text-center text-muted-foreground mt-3 max-w-lg mx-auto">
          Update your service provider information below.
        </p>
      </section>

      <DiscardChangesGuard
        show={showDialog}
        onDiscard={handleDiscard}
        onStay={handleStay}
      />

      <DeleteConfirmationDialog
        show={showDeleteDialog}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={removingService}
      />

      {/* Profile Card - Shows whose profile is being edited */}
      <section className="w-5/6 max-w-3xl mx-auto mb-8">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            {logoPreview || profileImage ? (
              <img
                src={logoPreview || profileImage}
                alt="Profile"
                className="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-cpg-teal/10 flex items-center justify-center">
                <span className="text-cpg-teal font-semibold text-xl">
                  {profileName?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profileName}</h2>
              <p className="text-sm text-muted-foreground">{profileEmail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Card */}
      <section className="w-5/6 max-w-3xl mx-auto">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Name */}
            <div>
              <RequiredLabel className="text-sm font-medium text-gray-700 mb-2 block">
                Company Name
              </RequiredLabel>
              <Input
                type="text"
                className="h-12 rounded-xl border-gray-200"
                {...register("company_name")}
                placeholder="Finback Services"
              />
              {errors.company_name && (
                <FormError message={errors.company_name.message} />
              )}
            </div>

            {/* Company Website */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Company Website
              </Label>
              <Input
                type="text"
                className="h-12 rounded-xl border-gray-200"
                {...register("company_website")}
                placeholder="https://company.com"
              />
              {errors.company_website && (
                <FormError message={errors.company_website.message} />
              )}
            </div>

            {/* Company Logo */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Company Logo
              </Label>
              {logoPreview && (
                <div className="mb-4">
                  <img
                    src={logoPreview}
                    alt="Current Logo"
                    className="h-20 w-20 object-contain rounded-xl border-2 border-gray-100"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                {...register("logo")}
                className="file:text-gray-500"
              />
              {errors.logo && (
                <FormError message={errors.logo.message.toString()} />
              )}
            </div>

            {/* About Service */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                About Service
              </Label>
              <Textarea
                {...register("customers_covered")}
                placeholder="e.g. Tell us more about your service..."
                rows={4}
                className="rounded-xl border-gray-200 focus:border-cpg-teal focus:ring-cpg-teal/20"
              />
              {errors.customers_covered && (
                <FormError message={errors.customers_covered.message} />
              )}
            </div>

            {/* Number of Employees */}
            <div>
              <RequiredLabel className="text-sm font-medium text-gray-700 mb-2 block">
                Number of Employees
              </RequiredLabel>
              <NumberInput
                placeholder="10"
                className="h-12 rounded-xl border-gray-200"
                {...register("num_employees")}
              />
              {errors.num_employees && (
                <FormError message="Please enter the number of employees" />
              )}
            </div>

            {/* Area of Specialization */}
            <div>
              <RequiredLabel className="text-sm font-medium text-gray-700 mb-2 block">
                Area of Specialization
              </RequiredLabel>
              <Textarea
                {...register("area_of_specialization")}
                placeholder="e.g. Supply Chain, Packaging"
                rows={3}
                className="rounded-xl border-gray-200 focus:border-cpg-teal focus:ring-cpg-teal/20"
              />
              {errors.area_of_specialization && (
                <FormError message={errors.area_of_specialization.message} />
              )}
            </div>

            {/* Category of Service */}
            <div>
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
                      <RequiredLabel className="text-sm font-medium text-gray-700 mb-3 block">
                        Category of Service
                      </RequiredLabel>
                      <div className="flex flex-wrap gap-2">
                        {categoryOfService.map(({ label }) => (
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
                              placeholder="Enter your category"
                              value={otherCat}
                              onChange={(e) => setOtherCat(e.target.value)}
                              className="flex-1 h-11 rounded-xl"
                            />
                            <Button
                              variant="default"
                              size="default"
                              type="button"
                              className="h-11 rounded-xl bg-cpg-teal hover:bg-cpg-teal/90"
                              onClick={() => {
                                const trimmed = toTitleCase(otherCat.trim());
                                const isDuplicate = field.value.some(
                                  (val) =>
                                    val.toLowerCase() === trimmed.toLowerCase()
                                );
                                const isValid = OTHER_SCHEMA.test(trimmed);

                                if (!trimmed) {
                                  setOtherCatError("Category cannot be empty.");
                                  return;
                                }
                                if (isDuplicate) {
                                  setOtherCatError("This category has already been added.");
                                  return;
                                }
                                if (!isValid) {
                                  setOtherCatError(
                                    "Must be at least 3 characters and contain only letters, numbers, spaces."
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
                          </div>
                          {otherCatError && <FormError message={otherCatError} />}
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
                      {errors.category_of_service && (
                        <FormError message={errors.category_of_service.message} />
                      )}
                    </div>
                  );
                }}
              />
            </div>

            {/* Type of Broker Service - Conditional */}
            {shouldShowBrokerServices && (
              <div>
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
                        <RequiredLabel className="text-sm font-medium text-gray-700 mb-3 block">
                          Type of Broker Service
                        </RequiredLabel>
                        <div className="flex flex-wrap gap-2">
                          {typeOfBrokerService.map(({ label }) => (
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
                        {errors.type_of_broker_service && (
                          <FormError message={errors.type_of_broker_service.message} />
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            )}

            {/* Markets Covered - Conditional */}
            {shouldShowMarketsCovered && (
              <div>
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
                      <div>
                        <RequiredLabel className="text-sm font-medium text-gray-700 mb-3 block">
                          Markets Covered
                        </RequiredLabel>
                        <div className="flex flex-wrap gap-2">
                          {marketsCovered.map(({ label }) => (
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
                        {errors.markets_covered && (
                          <FormError message={errors.markets_covered.message} />
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            )}

            {saveError && <FormError message={saveError.message} />}
            {removeError && <FormError message={removeError.message} />}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                variant="default"
                type="submit"
                size="lg"
                disabled={savingService}
                className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl"
              >
                <Send className="h-5 w-5 mr-2" />
                {savingService ? "Saving Changes..." : "Save Changes"}
              </Button>

              <Button
                variant="outline"
                type="button"
                size="lg"
                disabled={removingService}
                onClick={handleDeleteClick}
                className="w-full h-14 text-base rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {removingService ? "Deleting..." : "Delete Profile"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default EditServicePage;
