/**
 * @fileoverview API functions for fractional job listings
 * Handles CRUD operations for job posts with support for multiple poster types.
 */

import supabaseClient from "@/utils/supabase.js";

const TABLE_NAME = "job_listings";

/**
 * Fetch all job listings
 * @param {string} token - Clerk session token for Supabase authentication
 * @param {Object} filters - Filter options (currently unused, reserved for future filtering)
 * @returns {Promise<Array|null>} Array of job listings or null on error
 */
export async function getJobs(
  token,
  { area_specialization, level_exp, search_query },
) {
  const supabase = supabaseClient(token);

  let query = supabase.from(TABLE_NAME).select(`
    *,
    poster_profile:user_profiles!poster_id(full_name, profile_picture_url)
  `);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs: ", error);
    return null;
  }

  return data;
}

/**
 * Fetch jobs posted by a specific user
 * @param {string} token - Clerk session token
 * @param {Object} params - Query parameters
 * @param {string} params.poster_id - User ID of the job poster
 * @returns {Promise<Array|null>} Array of user's job listings or null on error
 */
export async function getMyJobs(
  token,
  { area_specialization, level_exp, search_query, poster_id },
) {
  const supabase = supabaseClient(token);

  let query = supabase.from(TABLE_NAME).select(`
    *,
    poster_profile:user_profiles!poster_id(full_name, profile_picture_url)
  `).eq("poster_id", poster_id);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs: ", error);
    return null;
  }

  return data;
}

/**
 * Fetch a single job listing by ID
 * @param {string} token - Clerk session token
 * @param {Object} params - Query parameters
 * @param {string} params.job_id - UUID of the job listing
 * @returns {Promise<Object|null>} Job listing object or null on error
 */
export async function getSingleJob(token, { job_id }) {
  const supabase = supabaseClient(token);
  let query = supabase.from(TABLE_NAME).select(`
    *,
    poster_profile:user_profiles!poster_id(full_name, profile_picture_url)
  `).eq("id", job_id).single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

/**
 * Create a new job listing
 *
 * Supports multiple poster types:
 * - Personal: Uses user's profile info (full_name, profile_picture_url)
 * - Brand: Uses brand profile info (brand_name, logo_url, brand_hq)
 * - Talent/Service: Uses user's profile info (same as personal)
 *
 * @param {string} token - Clerk session token
 * @param {Object} formData - Job posting form data
 * @param {string} formData.user_id - ID of the user creating the job
 * @param {string} formData.poster_type - "personal" | "brand" | "talent" | "service"
 * @param {string|null} formData.brand_profile_id - Brand UUID (if posting as brand)
 * @param {string} formData.job_title - Title of the job
 * @param {Array<string>} formData.area_of_specialization - Required specializations
 * @param {Array<string>} formData.level_of_experience - Required experience levels
 * @param {string} formData.work_location - "Remote" | "In-office" | "Hybrid"
 * @param {string} formData.scope_of_work - "Project-based" | "Ongoing"
 * @param {number} formData.estimated_hrs_per_wk - Estimated weekly hours
 * @param {string} formData.preferred_experience - Description of preferred experience
 * @param {FileList} [formData.job_description] - Optional PDF file upload
 * @returns {Promise<Object>} Created job listing or error
 */
export async function postJob(token, formData) {
  const supabase = supabaseClient(token);

  // Determine poster info based on whether a brand is specified
  let posterName = null;
  let posterLogo = null;
  let posterLocation = null;

  if (formData.brand_profile_id) {
    // Posting with a brand - fetch brand profile info
    const { data: brandData, error: brandError } = await supabase
      .from("brand_profiles")
      .select("brand_name, logo_url, brand_hq")
      .eq("id", formData.brand_profile_id)
      .single();

    if (brandError) {
      console.error("Error fetching brand:", brandError);
      throw new Error("Error fetching brand information");
    }

    posterName = brandData.brand_name;
    posterLogo = brandData.logo_url;
    posterLocation = brandData.brand_hq;
  } else {
    // No brand - fetch user profile for poster info
    const { data: userProfile, error: userError } = await supabase
      .from("user_profiles")
      .select("full_name, profile_picture_url")
      .eq("user_id", formData.user_id)
      .single();

    if (!userError && userProfile) {
      posterName = userProfile.full_name;
      posterLogo = userProfile.profile_picture_url;
    }
  }

  // Upload job description PDF if provided
  let job_desc_url = null;
  const jobDescFile = formData.job_description?.[0];

  if (jobDescFile) {
    const random = Math.floor(Math.random() * 90000);
    const extension = jobDescFile.name.split(".").pop().toLowerCase();
    const fileName = `job-${random}-${formData.user_id}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from("job-descriptions")
      .upload(fileName, jobDescFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Error uploading job description:", storageError);
      throw new Error(`Error uploading job description: ${storageError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("job-descriptions")
      .getPublicUrl(fileName);
    job_desc_url = publicUrlData?.publicUrl;
  }

  // Create job listing with brand info
  const { data: jobData, error: jobError } = await supabase
    .from("job_listings")
    .insert([
      {
        // Poster info (from brand)
        poster_id: formData.user_id,
        poster_type: formData.poster_type || "brand",
        poster_name: posterName,
        poster_logo: posterLogo,
        poster_location: posterLocation,
        brand_id: formData.brand_profile_id || null,
        // Job info
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

  if (jobError) {
    console.error("Error creating job:", jobError);
    throw new Error("Error creating job listing");
  }

  return jobData;
}

// Legacy function - kept for backwards compatibility during migration
export async function addNewJob(token, jobData) {
  return postJob(token, {
    ...jobData,
    user_id: jobData.brand_id || jobData.user_id,
    poster_type: "brand",
    poster_name: jobData.poster_name || "Unknown",
  });
}

// Legacy function - kept for backwards compatibility
export async function addNewJobWithBrand(token, formData) {
  return postJob(token, {
    ...formData,
    poster_type: "brand",
    poster_name: formData.brand_name || formData.poster_name,
  });
}

// Update job
export async function updateJob(token, { jobData, job_id, newLogo }) {
  const supabase = supabaseClient(token);

  // Build update object with only provided fields
  const updateData = {};

  // Poster info fields
  if (jobData.poster_name !== undefined)
    updateData.poster_name = jobData.poster_name;
  if (jobData.poster_location !== undefined)
    updateData.poster_location = jobData.poster_location;
  if (jobData.is_open !== undefined) updateData.is_open = jobData.is_open;

  // Job fields
  if (jobData.job_title !== undefined) updateData.job_title = jobData.job_title;
  if (jobData.preferred_experience !== undefined)
    updateData.preferred_experience = jobData.preferred_experience;
  if (jobData.level_of_experience !== undefined)
    updateData.level_of_experience = jobData.level_of_experience;
  if (jobData.work_location !== undefined)
    updateData.work_location = jobData.work_location;
  if (jobData.scope_of_work !== undefined)
    updateData.scope_of_work = jobData.scope_of_work;
  if (jobData.estimated_hrs_per_wk !== undefined)
    updateData.estimated_hrs_per_wk = jobData.estimated_hrs_per_wk;
  if (jobData.area_of_specialization !== undefined)
    updateData.area_of_specialization = jobData.area_of_specialization;

  // Handle job description PDF upload
  const jobDescFile = jobData.job_description?.[0];
  if (jobDescFile && jobDescFile instanceof File) {
    const fileName = formatJobDescriptionUrl(job_id, jobDescFile);
    const { error: storageError } = await supabase.storage
      .from("job-descriptions")
      .upload(fileName, jobDescFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Error uploading job description:", storageError);
      throw new Error(`Error uploading job description: ${storageError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("job-descriptions")
      .getPublicUrl(fileName);
    updateData.job_description = publicUrlData?.publicUrl;
  }

  // Handle logo upload
  if (newLogo && newLogo instanceof File) {
    const random = Math.floor(Math.random() * 90000);
    const extension = newLogo.name.split(".").pop().toLowerCase();
    const fileName = `logo-${random}-${job_id}.${extension}`;

    const { error: logoError } = await supabase.storage
      .from("brand-logos")
      .upload(fileName, newLogo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (logoError) {
      console.error("Error uploading logo:", logoError);
      throw new Error("Error uploading logo");
    }

    const { data: logoUrlData } = supabase.storage
      .from("brand-logos")
      .getPublicUrl(fileName);
    updateData.poster_logo = logoUrlData?.publicUrl;
  }

  // Only update if there's something to update
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

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}

// Read Saved Jobs (poster info is inline)
export async function getSavedJobs(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase.from("saved_jobs").select(
    `*,
      job: job_listings(*)`,
  );

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = supabaseClient(token);

  if (alreadySaved) {
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (deleteError) {
      console.error("Error removing saved job:", deleteError);
      return data;
    }

    return data;
  } else {
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (insertError) {
      console.error("Error saving job:", insertError);
      return data;
    }

    return data;
  }
}

// Job isOpen toggle
export async function updateHiringStatus(token, { is_open, job_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from("job_listings")
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

const formatJobDescriptionUrl = (user_id, file) => {
  const random = Math.floor(Math.random() * 90000);
  const extension = file.name.split(".").pop().toLowerCase();
  const fileName = `job-${random}-${user_id}.${extension}`;
  return fileName;
};
