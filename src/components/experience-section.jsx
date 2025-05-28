// TalentExperienceSection.jsx
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import useFetch from "@/hooks/use-fetch.jsx";
import {
  getAllExperiences,
  addNewExperience,
  deleteExperience,
  updateExperience,
} from "@/api/apiExperience.js";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Pencil, X } from "lucide-react";
import { WEBSITE_SCHEMA } from "@/constants/schemas.js";

const defaultClass = "";
const classLabel = "mb-1 block";
const classInput = "input-class";

const schema = z.object({
  brand_name: z.string().min(1, { message: "Brand name is required" }),
  brand_website: z
    .string()
    .min(1, { message: "Brand website is required" })
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return "";
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .refine((val) => !val || WEBSITE_SCHEMA.test(val), {
      message: "Must be a valid URL",
    }),
  brand_logo: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file?.[0] || // allow if no file selected
        ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
      { message: "Only PNG, JPG, or JPEG allowed" }
    ),
});

const TalentExperienceSection = ({ user_id, showEdit = false }) => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const { data, func: fetchExperiences } = useFetch(getAllExperiences);
  const { func: addExperience } = useFetch(addNewExperience);
  const { func: modifyExperience } = useFetch(updateExperience);
  const { func: removeExperience } = useFetch(deleteExperience);

  useEffect(() => {
    if (user_id) {
      fetchExperiences({ user_id });
    }
  }, [user]);

  useEffect(() => {
    if (data) setExperiences(data);
  }, [data]);

  const onSubmit = async (formData) => {
    const payload = {
      brand_name: formData.brand_name,
      brand_website: formData.brand_website,
      brand_logo: formData.brand_logo?.[0],
    };

    if (selectedExperience?.id) {
      await modifyExperience(payload, {
        user_id: user.id,
        experience_id: selectedExperience.id,
      });
    } else {
      await addExperience(payload, { user_id: user.id });
    }

    await fetchExperiences({ user_id: user.id });
    setOpen(false);
    setSelectedExperience(null);
    reset();
  };

  const handleDelete = async (id) => {
    await removeExperience({ experience_id: id });
    await fetchExperiences({ user_id: user.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Brand I've Worked With</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          {showEdit && (
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedExperience(null);
                  reset({
                    brand_name: "",
                    brand_website: "",
                    brand_logo: undefined,
                  });
                  setOpen(true);
                }}
                className="bg-cpg-brown hover:bg-cpg-brown/90 text-white font-normal"
                size="default"
                variant="default"
              >
                Add Experience
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className={defaultClass}>
            <DialogHeader className={defaultClass}>
              <DialogTitle className={defaultClass}>Add Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className={classLabel}>Brand Name</Label>
                <Input
                  {...register("brand_name")}
                  className={classInput}
                  type="text"
                />
              </div>
              {errors.brand_name && (
                <p className="text-sm text-red-500">
                  {errors.brand_name.message}
                </p>
              )}

              <div>
                <Label className={classLabel}>Brand Website</Label>
                <Input
                  {...register("brand_website")}
                  className={classInput}
                  type="url"
                />
              </div>
              {errors.brand_website && (
                <p className="text-sm text-red-500">
                  {errors.brand_website.message}
                </p>
              )}

              <div>
                <Label className={classLabel}>Brand Logo</Label>
                <div>
                  {selectedExperience?.brand_logo &&
                    typeof selectedExperience.brand_logo === "string" && (
                      <div className="mb-4">
                        <img
                          src={selectedExperience.brand_logo}
                          className="w-14 h-14 aspect-3/2 object-cover border rounded scale-100"
                          alt="Brand Logo"
                        />
                      </div>
                    )}

                  <Input
                    className={classInput}
                    type="file"
                    accept="image/*"
                    {...register("brand_logo")}
                  />
                </div>
              </div>
              {errors.brand_logo && (
                <p className="text-sm text-red-500">
                  {errors.brand_logo.message.toString()}
                </p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                className={"bg-cpg-brown hover:bg-cpg-brown/90"}
                size="default"
                variant="default"
                onClick={handleSubmit(onSubmit)}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4 my-4">
        {experiences.length < 1 ? (
          <p className="text-muted-foreground text-base whitespace-pre-line">
            No brands listed
          </p>
        ) : (
          <>
            {experiences.map(
              ({ id, brand_name, brand_website, brand_logo }) => (
                <span
                  key={id}
                  className="flex items-center gap-2 text-sm font-medium border px-4 py-1.5 rounded-md"
                >
                  {brand_logo && (
                    <img
                      src={brand_logo}
                      alt={brand_name}
                      className="w-11 h-11 rounded-full border object-cover cursor-pointer"
                    />
                  )}
                  <div className="flex-1">
                    {brand_website && (
                      <Link to={brand_website} className="hover:underline">
                        {brand_name}
                      </Link>
                    )}
                  </div>

                  {/* Edit Actions */}
                  {showEdit && (
                    <div className="mx-1 flex gap-2">
                      <button
                        type="button"
                        className="text-cpg-brown cursor-pointer"
                        onClick={() => {
                          setSelectedExperience({
                            id,
                            brand_name,
                            brand_website,
                            brand_logo,
                          });
                          reset({
                            brand_name,
                            brand_website,
                            brand_logo: brand_logo ? [brand_logo] : undefined,
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="w-4.5 h-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(id)}
                        className="text-red-600 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </span>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TalentExperienceSection;
