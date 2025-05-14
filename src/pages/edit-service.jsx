// EditServicePage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import useFetch from "@/hooks/use-fetch.jsx";
import { getMyServiceProfile, updateService } from "@/api/apiServices.js";
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
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

const schema = z
  .object({
    first_name: z.string().min(1, "First Name is required"),
    last_name: z.string().min(1, "Last Name is required"),
    company_name: z.string().min(1, "Company name is required"),
    company_website: z.string().url().optional(),
    logo: z
      .any()
      .optional()
      .refine(
        (file) =>
          !file?.[0] || // allow no file
          ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
        { message: "Only JPG, PNG, or JPEG images are allowed" }
      ),
    num_employees: z.preprocess((val) => {
      if (typeof val === "string") return parseInt(val, 10);
      if (typeof val === "number") return val;
      return undefined;
    }, z.number().int().nonnegative().optional()),
    area_of_specialization: z
      .string()
      .min(1, "Service specialization is required"),
    category_of_service: z
      .array(z.string())
      .min(1, "Select at least one category"),
    type_of_broker_service: z
      .array(z.string())
      .optional()
      .default([]),
    markets_covered: z
      .array(z.string())
      .optional()
      .default([]),
    customers_covered: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.category_of_service.includes("Broker") ||
      data.type_of_broker_service?.length > 0,
    {
      message: "Select at least one broker service",
      path: ["type_of_broker_service"],
    }
  )
  .refine(
    (data) =>
      !data.category_of_service.some((val) =>
        ["Broker", "Sales", "Merchandising"].includes(val)
      ) || data.markets_covered?.length > 0,
    {
      message: "Select at least one market",
      path: ["markets_covered"],
    }
  );

const classLabel = "mb-1 block";
const classInput = "input-class";

const EditServicePage = () => {
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef(null);
  const [profileLoad, showProfileLoad] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
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
    resolver: zodResolver(schema),
  });

  const {
    data: serviceData,
    loading,
    func: fetchService,
  } = useFetch(getMyServiceProfile);
  const {
    func: saveService,
    loading: saving,
    error: saveError,
  } = useFetch(updateService);

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

  const onSubmit = async (data) => {
    const firstName = data.first_name;
    const lastName = data.last_name;

    try {
      if (firstName !== user?.firstName || lastName !== user?.lastName) {
        await user.update({ firstName, lastName });
      }

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
      toast.success("Service profile updated!");

      navigate("/services", { replace: true });
    } catch (err) {
      toast.error("Failed to update service profile.");
    }
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
            <Label className="mb-1 block">First Name</Label>
            <Input
              className={classInput}
              type="text"
              placeholder="First name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-sm text-red-500">
                {errors.first_name.message}
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Last Name</Label>
            <Input
              className={classInput}
              type="text"
              placeholder="Last name"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-sm text-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Company Name */}
        <div>
          <Label className="mb-1 block">Company Name</Label>
          <Input
            type="text"
            className="input-class"
            {...register("company_name")}
            placeholder="Finback Services"
          />
          {errors.company_name && (
            <p className="text-sm text-red-500">
              {errors.company_name.message}
            </p>
          )}
        </div>

        {/* Company Website */}
        <div>
          <Label className="mb-1 block">Company Website</Label>
          <Input
            type="url"
            className="input-class"
            {...register("company_website")}
            placeholder="https://company.com"
          />
          {errors.company_website && (
            <p className="text-sm text-red-500">
              {errors.company_website.message}
            </p>
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
        </div>

        {/* Num Employees */}
        <div>
          <Label className="mb-1 block">Number of Employees</Label>
          <Input
            type="number"
            className="input-class"
            {...register("num_employees")}
            placeholder="10"
          />
          {errors.num_employees && (
            <p className="text-sm text-red-500">
              {errors.num_employees.message}
            </p>
          )}
        </div>

        {/* Area of Specialization */}
        <div>
          <Label className="mb-1 block">Area of Specialization</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            {...register("area_of_specialization")}
            placeholder="e.g. Supply Chain, Packaging"
          />
          {errors.area_of_specialization && (
            <p className="text-sm text-red-500">
              {errors.area_of_specialization.message}
            </p>
          )}
        </div>

        {/* Category of Service and Type of Broker Service */}
        <div className="flex flex-row gap-24 justify-around my-6">
          {/* Category of Service */}
          <div className="flex-1">
            <Controller
              name="category_of_service"
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
                    <Label className="mb-4 block">Category of Service</Label>
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
                  </div>
                );
              }}
            />
            {errors.category_of_service && (
              <p className="text-sm text-red-500">
                {errors.category_of_service.message}
              </p>
            )}
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
                      <Label className="mb-4 block">
                        Type of Broker Service
                      </Label>
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
                <p className="text-sm text-red-500">
                  {errors.type_of_broker_service.message}
                </p>
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
                    <Label className="mb-4 block">
                      Markets covered (relevant to broker, sales, &
                      merchandisers)
                    </Label>
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
              <p className="text-sm text-red-500">
                {errors.markets_covered.message}
              </p>
            )}
          </div>
        )}

        <div>
          <Label className="mb-1 block">Customers Covered</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            {...register("customers_covered")}
            placeholder="e.g. Retailers, Distributors, Restaurants"
          />
        </div>

        {saveError && (
          <p className="text-sm text-red-500">{saveError.message}</p>
        )}

        <Button
          variant="default"
          type="submit"
          size="lg"
          className="mt-4 bg-cpg-brown hover:bg-cpg-brown/90"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default EditServicePage;
