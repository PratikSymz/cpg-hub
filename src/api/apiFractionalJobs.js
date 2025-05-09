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

  if (area_specialization) {
    query = query.ilike("area_of_specialization", `%${area_specialization}%`);
  }

  if (level_exp) {
    query = query.ilike("level_of_experience", `%${level_exp}%`);
  }

  const safeQuery = search_query.replace(/[%_]/g, "\\$&");
  if (search_query) {
    query = query.or(`job_title.ilike.%${safeQuery}%`);
  }

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

  if (area_specialization) {
    query = query.contains("area_of_specialization", [area_specialization]);
  }

  if (level_exp) {
    query = query.contains("level_of_experience", [level_exp]);
  }

  if (search_query) {
    const safeQuery = search_query.replace(/[%_]/g, "\\$&");
    query = query.ilike("job_title", `%${safeQuery}%`);
  }

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
      brand: brand_profiles(brand_name, brand_desc, website, linkedin_url, brand_hq, logo_url),
      applications: applications(*)`
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

  const { data, error } = await supabase
    .from("job_listings")
    .insert([jobData])
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

  const { data, error } = await supabase
    .from(table_name)
    .update([jobData])
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
