import { WEBSITE_SCHEMA, LINKEDIN_SCHEMA } from "@/constants/schemas.js";
import { z } from "zod";
import { NameSchema } from "./name-schema.js";

export const BrandSchema = z.object({
  brand_name: z.string().min(1, { message: "Brand name is required" }),
  brand_desc: z.string().min(1, { message: "Brand description is required" }),
  website: z
    .string()
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return "";
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .refine((val) => !val || WEBSITE_SCHEMA.test(val), {
      message: "Must be a valid URL",
    })
    .optional(),
  linkedin_url: z
    .string()
    .transform((val) => {
      const trimmed = val.trim();
      if (!trimmed) return "";
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .refine(
      (val) =>
        !val || // allow empty
        LINKEDIN_SCHEMA.test(val),
      {
        message: "Must be a valid LinkedIn URL",
      }
    )
    .optional(),
  brand_hq: z.string().optional(),
  logo: z
    .any()
    .optional()
    .refine((file) => file && file.length > 0, {
      message: "Logo is required",
    })
    .refine(
      (file) =>
        file &&
        ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
      { message: "Only JPG, PNG, or JPEG images are allowed" }
    ),
});

export const BrandSchemaWithName = NameSchema.merge(BrandSchema);
