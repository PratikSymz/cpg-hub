import supabaseClient from "@/utils/supabase.js";

const table_name = "job_listings";
export async function getJobs(
  token,
  { area_specialization, level_exp, search_query }
) {
  const supabase = await supabaseClient(token);

  let query = supabase.from(table_name).select(
    `*, 
    brand: brand_profiles(brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url),
    saved: saved_jobs(id)`
  );

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs: ", error);
    return null;
  }

  return data;
}

export async function getMyJobs(
  token,
  { area_specialization, level_exp, search_query, brand_id }
) {
  const supabase = await supabaseClient(token);

  let query = supabase
    .from(table_name)
    .select(
      `*, 
    brand: brand_profiles(brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url),
    saved: saved_jobs(id)`
    )
    .eq("brand_id", brand_id);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs: ", error);
    return null;
  }

  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from(table_name)
    .select(
      `*, 
      brand: brand_profiles(brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url)`
    )
    .eq("id", job_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

// Post job
export async function addNewJob(token, jobData) {
  const supabase = await supabaseClient(token);

  // Current job description pdf url
  let job_desc_url = null;
  const file = jobData.job_description?.[0];

  const bucket = "job-descriptions";
  if (file) {
    // A new file was uploaded → upload it
    const fileName = formatJobDescriptionUrl(jobData.user_id, file);

    // Upload the file
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${fileName}`, file, {
        cacheControl: "3600",
        upsert: false, // prevent overwriting
      });

    if (storageError) {
      console.error("Error uploading new job description:", storageError);
      throw new Error("Error uploading new job description");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${fileName}`);
    job_desc_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert([
      {
        preferred_experience: jobData.preferred_experience,
        level_of_experience: jobData.level_of_experience,
        work_location: jobData.work_location,
        scope_of_work: jobData.scope_of_work,
        job_title: jobData.job_title,
        job_description: job_desc_url,
        estimated_hrs_per_wk: jobData.estimated_hrs_per_wk,
        area_of_specialization: jobData.area_of_specialization,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Job");
  }

  return data;
}

// Update job
export async function updateJob(token, { jobData, job_id }) {
  const supabase = await supabaseClient(token);

  // Current job description pdf url
  let job_desc_url = jobData.job_description;
  const file = jobData.job_description?.[0];

  const bucket = "job-descriptions";
  if (file) {
    // A new file was uploaded → upload it
    const fileName = formatJobDescriptionUrl(jobData.user_id, file);

    // Upload the file
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${fileName}`, file, {
        cacheControl: "3600",
        upsert: false, // prevent overwriting
      });

    if (storageError) {
      console.error("Error uploading new job description:", storageError);
      throw new Error("Error uploading new job description");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${fileName}`);
    job_desc_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from(table_name)
    .update([
      {
        preferred_experience: jobData.preferred_experience,
        level_of_experience: jobData.level_of_experience,
        work_location: jobData.work_location,
        scope_of_work: jobData.scope_of_work,
        job_title: jobData.job_title,
        job_description: job_desc_url,
        estimated_hrs_per_wk: jobData.estimated_hrs_per_wk,
        area_of_specialization: jobData.area_of_specialization,
      },
    ])
    .eq("id", job_id)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error updating Job");
  }

  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  const { data, error: deleteError } = await supabase
    .from(table_name)
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    console.error("Error deleting job:", deleteError);
    return data;
  }

  return data;
}

// Read Saved Jobs
export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.from("saved_jobs").select(
    `*, 
      job: job_listings(*, brand: brand_profiles(brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url))`
  );

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// - Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = await supabaseClient(token);

  if (alreadySaved) {
    // If the job is already saved, remove it
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
    // If the job is not saved, add it to saved jobs
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

// - Job isOpen toggle - (recruiter_id = auth.uid())
export async function updateHiringStatus(token, { is_open, job_id }) {
  const supabase = await supabaseClient(token);
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
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `job-${random}-${user_id}.${extension}`;
  return fileName;
};
