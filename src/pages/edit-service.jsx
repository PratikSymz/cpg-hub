// EditServicePage.jsx
import React, { useEffect, useState } from "react";
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
import { categoryOfService, marketsCovered } from "@/constants/filters.js";

const schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_website: z.string().url().optional(),
  area_of_specialization: z
    .string()
    .min(1, "Area of specialization is required"),
  category_of_service: z
    .array(z.string())
    .min(1, "Select at least one category"),
  markets_covered: z.array(z.string()).min(1, "Select at least one market"),
});

const EditServicePage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      company_name: "",
      company_website: "",
      area_of_specialization: "",
      category_of_service: [],
      markets_covered: [],
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
  const showMarkets = selectedCategories?.some((val) =>
    ["Broker", "Sales", "Merchandising"].includes(val)
  );

  useEffect(() => {
    if (isLoaded && user && user?.id) {
      fetchService({ user_id: user.id });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (serviceData) {
      setValue("company_name", serviceData.company_name || "");
      setValue("company_website", serviceData.company_website || "");
      setValue(
        "area_of_specialization",
        serviceData.area_of_specialization || ""
      );
      setValue("category_of_service", serviceData.category_of_service || []);
      setValue("markets_covered", serviceData.markets_covered || []);
    }
  }, [serviceData]);

  const onSubmit = async (data) => {
    await saveService(data, { user_id: user.id });
    // navigate("/services");
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Edit Service Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

        <div className="flex flex-col lg:flex-row gap-10 my-6">
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

          {/* Markets Covered */}
          {showMarkets && (
            <div className="flex-1">
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
                      <Label className="mb-4 block">Markets Covered</Label>
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
