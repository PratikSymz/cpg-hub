import supabaseClient from "@/utils/supabase.js";

const table_name = "talent_profiles";

// Fetch all Talent
export async function getAllTalent(
  token,
  { area_specialization, level_exp, search_query }
) {
  const supabase = await supabaseClient(token);

  // Talent Function field
  let query = supabase.from(table_name).select(
    `*, 
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`
  );
  if (area_specialization) {
    query = query.ilike("area_of_specialization", `%${area_specialization}%`);
  }

  if (level_exp) {
    query = query.ilike("level_of_experience", `%${level_exp}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Talents:", error);
    return null;
  }

  return data;
}

// Fetch single Talent
export async function getTalent(token, { talent_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(
      `*, 
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`
    )
    .eq("id", talent_id)
    .single();

  if (error) {
    console.error(`Error fetching Talent ${talent_id}:`, error);
    return null;
  }

  return data;
}

// Add Talent
export async function addNewTalent(token, _, talentData) {
  const supabase = await supabaseClient(token);

  const folder = "talent";
  const bucket = "resumes";
  const random = Math.floor(Math.random() * 90000);
  const file = talentData.resume?.[0];
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `logo-${random}-${"safeName"}.${extension}`;

  // Upload the file
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(`${folder}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (storageError) throw new Error("Error uploading resume");

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(`${folder}/${fileName}`);
  const resume_url = publicUrlData?.publicUrl;

  const { data, error } = await supabase
    .from(table_name)
    .insert([
      {
        user_id: talentData.user_id,
        level_of_experience: talentData.level_of_experience,
        industry_experience: talentData.industry_experience,
        area_of_specialization: talentData.area_of_specialization,
        linkedin_url: talentData.linkedin_url,
        portfolio_url: talentData.portfolio_url,
        resume_url: resume_url,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Talent");
  }

  return data;
}

// Update Talent Info
export async function updateTalent(token, { talent_id }, talent_data) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .update([talent_data])
    .eq("id", talent_id)
    .select();

  if (error) {
    console.error("Error Updating Talent information:", error);
    return null;
  }

  return data;
}

// Delete Talent
export async function deleteTalent(token, { talent_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("id", talent_id)
    .select();

  if (error) {
    console.error("Error deleting talent:", error);
    return data;
  }

  return data;
}
