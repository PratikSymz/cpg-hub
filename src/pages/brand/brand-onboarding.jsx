import React, { useEffect, useRef, useState } from "react";
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
import DiscardChangesGuard from "@/components/discard-changes-guard.jsx";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { addRole } from "@/hooks/use-user-roles.jsx";

const BrandOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const submittedRef = useRef(false);

  const [showDialog, setShowDialog] = useState(false);
  const [navTarget, setNavTarget] = useState(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(BrandSchema),
  });

  const logoFile = watch("logo")?.[0];

  // Generate a single object URL per selected file and revoke it on swap/unmount
  // to avoid leaking blob URLs on every render.
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

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
    loading: loadingBrandCreate,
    error: errorBrandCreate,
    func: funcCreateBrand,
  } = useFetch(addNewBrand);

  const onSubmit = async (data) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      if (user && user.id) {
        const result = await funcCreateBrand({ ...data, user_id: user.id });

        if (result.error) {
          throw new Error(
            errorBrandCreate.message || "Failed to create profile"
          );
        }

        await addRole(user, ROLE_BRAND);
        navigate("/post-job", { replace: true });
        toast.success("Profile Created!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create profile!");
      submittedRef.current = false;
    }
  };

  if (!isLoaded || loadingBrandCreate) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

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
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        Brand Onboarding
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col w-5/6 justify-self-center gap-6 m-6 pb-0"
      >
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
          <RequiredLabel className={classLabel}>Brand Logo</RequiredLabel>
          {logoPreview && (
            <img
              src={logoPreview}
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

        <div>
          <RequiredLabel className={classLabel}>Website</RequiredLabel>
          <Input
            type="text"
            placeholder="https://yourbrand.com"
            className={classInput}
            {...register("website")}
          />
          {errors.website && <FormError message={errors.website.message} />}
        </div>

        <div className="border-t pt-4">
          <Button
            size="default"
            variant="ghost"
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="w-full flex items-center justify-between py-4 px-0 hover:bg-transparent hover:underline"
          >
            <span className="text-lg font-semibold">
              Additional Info (Optional)
            </span>

            {showAdditionalInfo ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>

          {showAdditionalInfo && (
            <div className="mt-4 space-y-6 px-2">
              <div>
                <Label className={classLabel}>Brand Description</Label>
                <Textarea
                  className={classTextArea}
                  {...register("brand_desc")}
                  placeholder="e.g. We believe everyone should have better, more exciting coffee experiences..."
                />
                {errors.brand_desc && (
                  <FormError message={errors.brand_desc.message} />
                )}
              </div>

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

              <div>
                <Label className={classLabel}>Brand HQ / Location</Label>
                <Input
                  type="text"
                  className={classInput}
                  placeholder="New York, NY"
                  {...register("brand_hq")}
                />
                {errors.brand_hq && (
                  <FormError message={errors.brand_hq.message} />
                )}
              </div>
            </div>
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
