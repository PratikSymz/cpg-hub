import React, { useEffect } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarLoader } from "react-spinners";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { addNewBrand } from "@/api/apiBrands.js";
import { ROLE_BRAND } from "@/constants/roles.js";

const schema = z.object({
  brand_name: z.string().min(1, { message: "Brand name is required" }),
  website: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  brand_hq: z.string().optional(),
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
});

const BrandOnboarding = () => {
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const {
    loading: loadingBrandCreate,
    error: errorBrandCreate,
    data: dataBrandCreate,
    func: funcCreateBrand,
  } = useFetch(addNewBrand);

  const onSubmit = (data) => {
    handleRoleSelection(ROLE_BRAND);
    funcCreateBrand({
      ...data,
      user_id: user.id,
    });
  };

  if (!isLoaded || loadingBrandCreate) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (dataBrandCreate) {
    navigate("/post-job");
  }

  return (
    <div>
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        Brand Onboarding
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col w-5/6 justify-self-center gap-6 m-6 pb-0"
      >
        {/* Brand Name */}
        <div>
          <Label className="mb-1 block">Brand Name</Label>
          <Input
            type="text"
            placeholder="e.g. Oatly"
            className="input-class"
            {...register("brand_name")}
          />
          {errors.brand_name && (
            <p className="text-sm text-red-500">{errors.brand_name.message}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <Label className="mb-1 block">Website</Label>
          <Input
            type="text"
            placeholder="https://yourbrand.com"
            className="input-class"
            {...register("website")}
          />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website.message}</p>
          )}
        </div>

        {/* LinkedIn */}
        <div>
          <Label className="mb-1 block">LinkedIn URL</Label>
          <Input
            type="text"
            className="input-class"
            placeholder="https://linkedin.com/company/your-brand"
            {...register("linkedin_url")}
          />
          {errors.linkedin_url && (
            <p className="text-sm text-red-500">
              {errors.linkedin_url.message}
            </p>
          )}
        </div>

        {/* Brand HQ */}
        <div>
          <Label className="mb-1 block">Brand HQ / Location</Label>
          <Input
            type="text"
            className="input-class"
            placeholder="New York, NY"
            {...register("brand_hq")}
          />
        </div>

        {/* Logo URL */}
        <div>
          <Label className="mb-1 block">Brand Logo</Label>
          <Input
            type="file"
            accept="image/*"
            className="file:text-gray-500"
            {...register("logo")}
          />
        </div>

        {errorBrandCreate?.message && (
          <p className="text-sm text-red-500">{errorBrandCreate?.message}</p>
        )}
        <Button variant="default" type="submit" className="mt-6" size="lg">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default BrandOnboarding;
