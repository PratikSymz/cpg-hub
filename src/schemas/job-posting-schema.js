/**
 * @fileoverview Zod validation schema for job posting form
 * Handles validation for all poster types: personal, brand, talent, and service
 */

import { z } from "zod";

import { LINKEDIN_SCHEMA, WEBSITE_SCHEMA } from "@/constants/schemas.js";

/**
 * Job Posting Schema
 *
 * Validates the job posting form with conditional requirements:
 * - poster_type: "personal" | "brand" | "talent" | "service"
 * - brand_selection: "none" | "existing" | "new"
 *
 * Brand fields are only required when brand_selection is "new".
 * Brand profile ID is required when brand_selection is "existing".
 * When poster_type is "personal", "talent", or "service" with brand_selection "none",
 * no brand fields are required.
 */
export const JobPostingSchema = z
  .object({
    // Poster type selection
    poster_type: z.enum(["personal", "brand", "talent", "service"], {
      message: "Select who you're posting as",
    }),

    // Brand selection mode
    brand_selection: z.enum(["existing", "new", "none"], {
      message: "Select how to specify the brand",
    }),

    // Existing brand profile ID (required if brand_selection is "existing")
    brand_profile_id: z.string().optional(),

    // New brand fields
    brand_name: z.string().optional(),
    brand_logo: z.any().optional(),
    brand_website: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return "";
        const trimmed = val.trim();
        if (!trimmed) return "";
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      }),
    // Optional brand fields
    brand_location: z.string().optional(),
    brand_linkedin_url: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return "";
        const trimmed = val.trim();
        if (!trimmed) return "";
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      }),
    brand_desc: z.string().optional(),

    // Job fields (always required)
    job_title: z.string().min(1, { message: "Job title is required" }),
    preferred_experience: z
      .string()
      .min(1, { message: "Preferred experience is required" }),
    level_of_experience: z
      .array(z.string())
      .min(1, "Select at least one level of experience"),
    work_location: z.enum(["Remote", "In-office", "Hybrid"], {
      message: "Select a work location",
    }),
    scope_of_work: z.enum(["Project-based", "Ongoing"], {
      message: "Select a scope of work",
    }),
    estimated_hrs_per_wk: z.preprocess(
      (a) => {
        if (typeof a === "string") return parseInt(a, 10);
        if (typeof a === "number") return a;
        return undefined;
      },
      z
        .number()
        .int("Must be a whole number")
        .min(1, "Must be at least 1 hour/week")
        .lte(40, "Must be 40 or below"),
    ),
    area_of_specialization: z
      .array(z.string())
      .min(1, "Select at least one specialization"),
    job_description: z
      .any()
      .optional()
      .refine(
        (file) =>
          !file?.[0] || // allow empty (optional)
          ["application/pdf"].includes(file[0]?.type),
        {
          message: "Only PDF files are allowed",
        },
      ),
  })
  .refine(
    (data) => {
      // If using existing brand, brand_profile_id is required
      if (data.brand_selection === "existing") {
        return !!data.brand_profile_id;
      }
      return true;
    },
    {
      message: "Please select a brand",
      path: ["brand_profile_id"],
    },
  )
  .refine(
    (data) => {
      // If creating new brand, brand_name is required
      if (data.brand_selection === "new") {
        return !!data.brand_name && data.brand_name.trim().length > 0;
      }
      return true;
    },
    {
      message: "Brand name is required",
      path: ["brand_name"],
    },
  )
  .refine(
    (data) => {
      // If creating new brand, brand_logo is required
      if (data.brand_selection === "new") {
        return data.brand_logo && data.brand_logo.length > 0;
      }
      return true;
    },
    {
      message: "Brand logo is required",
      path: ["brand_logo"],
    },
  )
  .refine(
    (data) => {
      // If creating new brand, brand_website is required
      if (data.brand_selection === "new") {
        return !!data.brand_website && data.brand_website.trim().length > 0;
      }
      return true;
    },
    {
      message: "Brand website is required",
      path: ["brand_website"],
    },
  )
  .refine(
    (data) => {
      // Validate website URL format if provided
      if (data.brand_selection === "new" && data.brand_website) {
        return WEBSITE_SCHEMA.test(data.brand_website);
      }
      return true;
    },
    {
      message: "Must be a valid URL",
      path: ["brand_website"],
    },
  )
  .refine(
    (data) => {
      // Validate LinkedIn URL format if provided
      if (
        data.brand_linkedin_url &&
        data.brand_linkedin_url.trim().length > 0
      ) {
        return LINKEDIN_SCHEMA.test(data.brand_linkedin_url);
      }
      return true;
    },
    {
      message: "Must be a valid LinkedIn URL",
      path: ["brand_linkedin_url"],
    },
  )
  .refine(
    (data) => {
      // Validate logo file type if provided
      if (data.brand_selection === "new" && data.brand_logo?.[0]) {
        return ["image/png", "image/jpg", "image/jpeg"].includes(
          data.brand_logo[0]?.type,
        );
      }
      return true;
    },
    {
      message: "Only JPG, PNG, or JPEG images are allowed",
      path: ["brand_logo"],
    },
  );
