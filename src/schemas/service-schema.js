import { WEBSITE_SCHEMA } from "@/constants/schemas.js";
import { z } from "zod";

export const ServiceSchema = z
  .object({
    company_name: z.string().min(1, "Company name is required"),
    company_website: z
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
    logo: z
      .any()
      .optional()
      .refine(
        (file) =>
          !file?.[0] || // allow no file
          ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
        { message: "Only JPG, PNG, or JPEG images are allowed" }
      ),
    num_employees: z.preprocess((val) => {
      if (typeof val === "string") return parseInt(val, 10);
      if (typeof val === "number") return val;
      return undefined;
    }, z.number().int().nonnegative().optional()),
    area_of_specialization: z
      .string()
      .min(1, "Service specialization is required"),
    category_of_service: z
      .array(z.string())
      .min(1, "Select at least one category"),
    type_of_broker_service: z.array(z.string()).optional().default([]),
    markets_covered: z.array(z.string()).optional().default([]),
    customers_covered: z.string().min(1, "Service description is required"),
  })
  .refine(
    (data) =>
      !data.category_of_service.includes("Broker") ||
      data.type_of_broker_service?.length > 0,
    {
      message: "Select at least one broker service",
      path: ["type_of_broker_service"],
    }
  )
  .refine(
    (data) =>
      !data.category_of_service.some((val) =>
        ["Broker", "Sales", "Merchandising"].includes(val)
      ) || data.markets_covered?.length > 0,
    {
      message: "Select at least one market",
      path: ["markets_covered"],
    }
  );

export const ServiceSchemaWithName = z
  .object({
    first_name: z.string().min(1, "First Name is required"),
    last_name: z.string().min(1, "Last Name is required"),
    company_name: z.string().min(1, "Company name is required"),
    company_website: z
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
    logo: z
      .any()
      .optional()
      .refine(
        (file) =>
          !file?.[0] || // allow no file
          ["image/png", "image/jpg", "image/jpeg"].includes(file[0]?.type),
        { message: "Only JPG, PNG, or JPEG images are allowed" }
      ),
    num_employees: z.preprocess((val) => {
      if (typeof val === "string") return parseInt(val, 10);
      if (typeof val === "number") return val;
      return undefined;
    }, z.number().int().nonnegative().optional()),
    area_of_specialization: z
      .string()
      .min(1, "Service specialization is required"),
    category_of_service: z
      .array(z.string())
      .min(1, "Select at least one category"),
    type_of_broker_service: z.array(z.string()).optional().default([]),
    markets_covered: z.array(z.string()).optional().default([]),
    customers_covered: z.string().min(1, "Service description is required"),
  })
  .refine(
    (data) =>
      !data.category_of_service.includes("Broker") ||
      data.type_of_broker_service?.length > 0,
    {
      message: "Select at least one broker service",
      path: ["type_of_broker_service"],
    }
  )
  .refine(
    (data) =>
      !data.category_of_service.some((val) =>
        ["Broker", "Sales", "Merchandising"].includes(val)
      ) || data.markets_covered?.length > 0,
    {
      message: "Select at least one market",
      path: ["markets_covered"],
    }
  );
