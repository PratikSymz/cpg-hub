import React, { useEffect } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useUser } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarLoader } from "react-spinners";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import useFetch from "@/hooks/use-fetch.jsx";
import { addNewBrand } from "@/api/apiBrands.js";
import { ROLE_BRAND } from "@/constants/roles.js";
import { BrandSchema } from "@/schemas/brand-schema.js";
import RequiredLabel from "@/components/required-label.jsx";
import FormError from "@/components/form-error.jsx";
import {
  classLabel,
  classInput,
  classTextArea,
} from "@/constants/classnames.js";
import { toast } from "sonner";

const BrandOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleRoleSelection = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        toast.success(`Role updated to: ${role}`);
        console.log(`Role updated to: ${role}`);
      })
      .catch((err) => {
        toast.error("Error updating role");
        console.error("Error updating role:", err);
      });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(BrandSchema),
  });

  const {
    loading: loadingBrandCreate,
    error: errorBrandCreate,
    func: funcCreateBrand,
  } = useFetch(addNewBrand);

  const onSubmit = async (data) => {
    try {
      await handleRoleSelection(ROLE_BRAND);
      if (user && user.id) {
        await funcCreateBrand({
          ...data,
          user_id: user.id,
        });
      }
      toast.success("Profile Created!");
      navigate("/post-job", { replace: true });
    } catch (err) {
      console.log(err);
      toast.error("Failed to create profile!");
    }
  };

  if (!isLoaded || loadingBrandCreate) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
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
          <RequiredLabel className={classLabel}>Brand Name</RequiredLabel>
          <Input
            type="text"
            placeholder="e.g. Slingshot Coffee"
            className={classInput}
            {...register("brand_name")}
          />
          {errors.brand_name && (
            <FormError message={errors.brand_name.message} />
          )}
        </div>

        <div>
          <RequiredLabel className={classLabel}>
            Brand Description
          </RequiredLabel>
          <Textarea
            className={classTextArea}
            {...register("brand_desc")}
            placeholder="e.g. We believe everyone should have better, more exciting coffee experiences..."
          />
          {errors.brand_desc && (
            <FormError message={errors.brand_desc.message} />
          )}
        </div>

        {/* Website */}
        <div>
          <Label className={classLabel}>Website</Label>
          <Input
            type="text"
            placeholder="https://yourbrand.com"
            className={classInput}
            {...register("website")}
          />
          {errors.website && <FormError message={errors.website.message} />}
        </div>

        {/* LinkedIn */}
        <div>
          <Label className={classLabel}>LinkedIn URL</Label>
          <Input
            type="text"
            className={classInput}
            placeholder="https://linkedin.com/company/your-brand"
            {...register("linkedin_url")}
          />
          {errors.linkedin_url && (
            <FormError message={errors.linkedin_url.message} />
          )}
        </div>

        {/* Brand HQ */}
        <div>
          <Label className={classLabel}>Brand HQ / Location</Label>
          <Input
            type="text"
            className={classInput}
            placeholder="New York, NY"
            {...register("brand_hq")}
          />
          {errors.brand_hq && <FormError message={errors.brand_hq.message} />}
        </div>

        {/* Logo URL */}
        <div>
          <RequiredLabel className={classLabel}>Brand Logo</RequiredLabel>
          {watch("logo")?.[0] && (
            <img
              src={URL.createObjectURL(watch("logo")[0])}
              alt="Logo Preview"
              className="my-2 max-h-32 rounded-lg"
            />
          )}
          <Input
            type="file"
            accept="image/*"
            className="file:text-gray-500"
            onChange={(e) => {
              const files = e.target.files;
              if (files.length > 0) {
                setValue("logo", files, { shouldValidate: true });
              } else {
                setValue("logo", null, { shouldValidate: true });
              }
            }}
          />
          {errors.logo && (
            <FormError message={errors.logo.message.toString()} />
          )}
        </div>

        {errorBrandCreate?.message && (
          <FormError message={errorBrandCreate?.message} />
        )}

        <Button
          variant="default"
          type="submit"
          className="mt-4 bg-cpg-brown hover:bg-cpg-brown/90"
          size="lg"
        >
          Submit
        </Button>
      </form>
    </div>
  );
};

export default BrandOnboarding;
