import supabaseClient from "@/utils/supabase.js";
import { uploadToBucket } from "@/utils/storage.js";
import { STORAGE_BUCKETS } from "@/constants/storage.js";

const TABLE_NAME = "job_listings";
const JOB_SELECT = `
    *,
    poster_profile:user_profiles!poster_id(full_name, profile_picture_url)
  `;

export async function getJobs(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase.from(TABLE_NAME).select(JOB_SELECT);

  if (error) {
    console.error("Error fetching jobs:", error);
    return null;
  }
  return data;
}

export async function getMyJobs(token, { poster_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(JOB_SELECT)
    .eq("poster_id", poster_id);

  if (error) {
    console.error("Error fetching jobs:", error);
    return null;
  }
  return data;
}

export async function getSingleJob(token, { job_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(JOB_SELECT)
    .eq("id", job_id)
    .single();

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }
  return data;
}

export async function postJob(token, formData) {
  const supabase = supabaseClient(token);

  let posterName = null;
  let posterLogo = null;
  let posterLocation = null;

  if (formData.brand_profile_id) {
    const { data: brand, error: brandError } = await supabase
      .from("brand_profiles")
      .select("brand_name, logo_url, brand_hq")
      .eq("id", formData.brand_profile_id)
      .single();

    if (brandError) {
      console.error("Error fetching brand:", brandError);
      throw new Error("Error fetching brand information");
    }

    posterName = brand.brand_name;
    posterLogo = brand.logo_url;
    posterLocation = brand.brand_hq;
  } else {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("full_name, profile_picture_url")
      .eq("user_id", formData.user_id)
      .single();

    if (userProfile) {
      posterName = userProfile.full_name;
      posterLogo = userProfile.profile_picture_url;
    }
  }

  const jobDescFile = formData.job_description?.[0];
  const job_desc_url = jobDescFile
    ? await uploadToBucket(supabase, {
        bucket: STORAGE_BUCKETS.JOB_DESCRIPTIONS,
        folder: "",
        file: jobDescFile,
        prefix: "job",
        identifier: formData.user_id,
      })
    : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        poster_id: formData.user_id,
        poster_type: formData.poster_type || "brand",
        poster_name: posterName,
        poster_logo: posterLogo,
        poster_location: posterLocation,
        brand_id: formData.brand_profile_id || null,
        job_title: formData.job_title,
        job_description: job_desc_url,
        preferred_experience: formData.preferred_experience,
        level_of_experience: formData.level_of_experience,
        work_location: formData.work_location,
        scope_of_work: formData.scope_of_work,
        estimated_hrs_per_wk: formData.estimated_hrs_per_wk,
        area_of_specialization: formData.area_of_specialization,
        is_open: true,
      },
    ])
    .select();

  if (error) {
    console.error("Error creating job:", error);
    throw new Error("Error creating job listing");
  }

  return data;
}

export async function updateJob(token, { jobData, job_id, newLogo }) {
  const supabase = supabaseClient(token);
  const updateData = {};

  const passthrough = [
    "poster_name",
    "poster_location",
    "is_open",
    "job_title",
    "preferred_experience",
    "level_of_experience",
    "work_location",
    "scope_of_work",
    "estimated_hrs_per_wk",
    "area_of_specialization",
  ];
  for (const key of passthrough) {
    if (jobData[key] !== undefined) updateData[key] = jobData[key];
  }

  const jobDescFile = jobData.job_description?.[0];
  if (jobDescFile instanceof File) {
    updateData.job_description = await uploadToBucket(supabase, {
      bucket: STORAGE_BUCKETS.JOB_DESCRIPTIONS,
      folder: "",
      file: jobDescFile,
      prefix: "job",
      identifier: job_id,
    });
  }

  if (newLogo instanceof File) {
    updateData.poster_logo = await uploadToBucket(supabase, {
      bucket: "brand-logos",
      folder: "",
      file: newLogo,
      prefix: "logo",
      identifier: job_id,
    });
  }

  if (Object.keys(updateData).length === 0) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq("id", job_id)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error updating Job");
  }

  return { data, error: null };
}

export async function deleteJob(token, { job_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", job_id)
    .select();

  if (error) console.error("Error deleting job:", error);
  return data;
}

export async function getSavedJobs(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select(`*, job: job_listings(*)`);

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }
  return data;
}

export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = supabaseClient(token);

  if (alreadySaved) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (error) console.error("Error removing saved job:", error);
    return data;
  }

  const { data, error } = await supabase
    .from("saved_jobs")
    .insert([saveData])
    .select();

  if (error) console.error("Error saving job:", error);
  return data;
}

export async function updateHiringStatus(token, { is_open, job_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ is_open })
    .eq("id", job_id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }
  return data;
}
