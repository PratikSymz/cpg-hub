import { z } from "zod";

export const JobSchema = z.object({
  preferred_experience: z
    .string()
    .min(1, { message: "Preferred experience is required" }),
  level_of_experience: z.array(z.string()).min(1, "Select at least one level"),
  work_location: z.enum(["Remote", "In-office", "Hybrid"], {
    message: "Select a work location",
  }),
  scope_of_work: z.enum(["Project-based", "Ongoing"], {
    message: "Select a scope of work",
  }),
  job_title: z.string().min(1, { message: "Title is required" }),
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
      .lte(40, "Must be 40 or below")
  ),
  area_of_specialization: z
    .array(z.string())
    .min(1, "Select at least one specialization"),
});
