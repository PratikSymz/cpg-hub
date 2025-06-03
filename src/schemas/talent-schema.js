import { LINKEDIN_SCHEMA, WEBSITE_SCHEMA } from "@/constants/schemas.js";
import { z } from "zod";
import { NameSchema } from "./name-schema.js";

export const TalentSchema = z.object({
  level_of_experience: z
    .array(z.string())
    .min(1, "Experience level is required"),
  industry_experience: z.string().min(1, "Industry Experience is required"),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Area of specialization is required"),
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
  portfolio_url: z
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
  resume: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file?.[0] || // allow empty (optional)
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file[0]?.type),
      {
        message: "Only PDF, DOC, or DOCX files are allowed",
      }
    ),
});

export const TalentSchemaWithName = NameSchema.merge(TalentSchema);
