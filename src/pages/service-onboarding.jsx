import React from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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

const schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_website: z.string().url().optional(),
  logo: z
    .any()
    .refine(
      (file) =>
        file[0] &&
        (file[0].type === "image/png" ||
          file[0].type === "image/jpg" ||
          file[0].type === "image/jpeg"),
      {
        message: "Only Images are allowed",
      }
    ),
  num_employees: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().int().nonnegative().optional()
  ),
  area_of_specialization: z
    .string()
    .min(1, "Service specialization is required"),
  category_of_service: z
    .array(z.string())
    .min(1, "Select at least one category"),
  type_of_broker_service: z
    .array(z.string())
    .min(1, "Select at least one broker service"),
  markets_covered: z
    .array(z.string())
    .min(1, "Select at least one market")
    .optional(),
  customers_covered: z.string().optional(),
});

const ServiceOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        console.log(`Role updated to: ${role}`);
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category_of_service: [],
      type_of_broker_service: [],
      markets_covered: [],
    },
    resolver: zodResolver(schema),
  });

  const {
    func: submitBrokerProfile,
    loading,
    error,
    data,
  } = useFetch(addNewService);

  const onSubmit = (data) => {
    handleRoleSelection(ROLE_SERVICE);
    submitBrokerProfile({
      ...data,
      is_broker: shouldShowBrokerServices,
      user_id: user.id,
    });
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (data) {
    navigate("/services");
  }

  const selectedCategories = useWatch({ control, name: "category_of_service" });
  // Define what triggers the next field
  const shouldShowBrokerServices = selectedCategories?.some((val) =>
    ["Broker"].includes(val)
  );

  const shouldShowMarketsCovered = selectedCategories?.some((val) =>
    ["Broker", "Sales", "Merchandising"].includes(val)
  );
  return (
    <div>
      <h1 className="text-4xl font-bold text-center mb-10">
        Service Provider Onboarding
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
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
            type="text"
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
          <Label className="mb-1 block">Company Logo</Label>
          <Input
            type="file"
            accept="image/*"
            className="file:text-gray-500"
            {...register("logo")}
          />
        </div>

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

        <div>
          <Label className="mb-1 block">Area of Specialization</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            {...register("area_of_specialization")}
            placeholder="e.g. Supply Chain, Packaging"
          />
        </div>

        {/* Category of Service and Type of Broker Service */}
        <div className="flex flex-row gap-24 justify-around my-6">
          <div className="flex-1">
            <Controller
              name="category_of_service"
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
                    <Label className="mb-4 block">Category of Service</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryOfService.map(({ label, value }) => (
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
            {errors.category_of_service && (
              <p className="text-sm text-red-500">
                {errors.category_of_service.message}
              </p>
            )}
          </div>

          {shouldShowBrokerServices && (
            <div className="flex-1">
              <Controller
                name="type_of_broker_service"
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
                      <Label className="mb-4 block">
                        Type of Broker Service
                      </Label>
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
                  const selected = field.value.includes(value);
                  const updated = selected
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

        {error && <p className="text-sm text-red-500">{error.message}</p>}

        <Button variant="default" type="submit" size="lg" className="mt-4">
          Submit Profile
        </Button>
      </form>
    </div>
  );
};

export default ServiceOnboarding;
