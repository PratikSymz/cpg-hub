import React, { useEffect, useRef, useState } from "react";
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
import { getMyBrandProfile, updateBrand } from "@/api/apiBrands.js";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

const schema = z.object({
  brand_name: z.string().min(1, { message: "Brand name is required" }),
  website: z.string().url().optional(),
  linkedin_url: z.string().url().optional(),
  brand_hq: z.string().optional(),
  logo: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file?.[0] ||
        ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
      { message: "Only PNG, JPG, or JPEG allowed" }
    ),
  brand_desc: z.string().min(1, { message: "Brand description is required" }),
});

const classLabel = "mb-1 block";
const classInput = "input-class";

const EditBrandPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      brand_name: "",
      website: "",
      linkedin_url: "",
      brand_hq: "",
      brand_desc: "",
    },
  });

  const {
    loading,
    data: brandData,
    func: fetchBrand,
  } = useFetch(getMyBrandProfile);
  const { loading: saving, func: saveBrand } = useFetch(updateBrand);

  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchBrand({ user_id: user.id });
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (brandData) {
      setValue("brand_name", brandData.brand_name || "");
      setValue("website", brandData.website || "");
      setValue("linkedin_url", brandData.linkedin_url || "");
      setValue("brand_hq", brandData.brand_hq || "");
      if (brandData.logo_url) {
        setLogoPreview(brandData.logo_url);
      }
    }
  }, [brandData]);

  const onSubmit = async (data) => {
    const logoFile = data.logo?.[0];

    try {
      await saveBrand(
        null,
        {
          brand_name: data.brand_name,
          website: data.website,
          linkedin_url: data.linkedin_url,
          brand_hq: data.brand_hq,
          logo: logoFile,
        },
        { user_id: user.id }
      );

      toast.success("Brand profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update brand profile.");
    }
  };

  const [profileLoad, showProfileLoad] = useState(false);
  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update Clerk profile picture
    try {
      showProfileLoad(true);
      await user.setProfileImage({
        file,
      });

      toast.success("Profile picture updated!");
      showProfileLoad(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile picture.");
    }
  };

  if (!isLoaded || loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold mb-6">Edit Profile</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-5/6 mx-auto"
      >
        {/* Profile Pic */}
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

        {/* First and Last name */}
        <div className="grid grid-cols-2 gap-6 my-6">
          <div>
            <Label className={classLabel}>First Name</Label>
            <Input
              className={classInput}
              type="text"
              name="first_name"
              placeholder="First name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <Label className={classLabel}>Last Name</Label>
            <Input
              className={classInput}
              type="text"
              name="last_name"
              placeholder="Last name"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-red-500">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Brand Name */}
        <div>
          <Label>Brand Name</Label>
          <Input
            type="text"
            {...register("brand_name")}
            placeholder="e.g. Slingshot Coffee"
          />
          {errors.brand_name && (
            <p className="text-red-500">{errors.brand_name.message}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block">Brand Description</Label>
          <Textarea
            className="textarea-class resize block w-full h-24"
            {...register("brand_desc")}
            placeholder="e.g. We believe everyone should have better, more exciting coffee experiences..."
          />
          {errors.brand_desc && (
            <p className="text-sm text-red-500">{errors.brand_desc.message}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <Label>Website</Label>
          <Input
            type="url"
            {...register("website")}
            placeholder="https://yourbrand.com"
          />
          {errors.website && (
            <p className="text-red-500">{errors.website.message}</p>
          )}
        </div>

        {/* LinkedIn */}
        <div>
          <Label>LinkedIn URL</Label>
          <Input
            type="url"
            {...register("linkedin_url")}
            placeholder="https://linkedin.com/company/your-brand"
          />
          {errors.linkedin_url && (
            <p className="text-red-500">{errors.linkedin_url.message}</p>
          )}
        </div>

        {/* Brand HQ */}
        <div>
          <Label>Brand HQ</Label>
          <Input
            type="text"
            {...register("brand_hq")}
            placeholder="New York, NY"
          />
        </div>

        {/* Logo */}
        <div>
          <Label>Brand Logo</Label>
          {logoPreview && (
            <div className="mb-4">
              <img
                src={logoPreview}
                alt="Current Logo"
                className="h-24 w-24 object-cover rounded border"
              />
            </div>
          )}
          <Input type="file" accept="image/*" {...register("logo")} />
          {errors.logo && <p className="text-red-500">{errors.logo.message}</p>}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default EditBrandPage;
