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

  // if (area_specialization) {
  //   query = query.contains("area_of_specialization", [area_specialization]);
  // }

  // if (level_exp) {
  //   query = query.contains("level_of_experience", [level_exp]);
  // }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error.message);
    console.error("Details:", error.details);
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

// Fetch my profile
export async function getMyTalentProfile(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(
      `*, 
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`
    )
    .eq("user_id", user_id)
    .single();

  if (error) {
    console.error(`Error fetching my profile ${user_id}:`, error);
    return null;
  }

  return data;
}

// Add Talent
export async function addNewTalent(token, talentData) {
  console.log(talentData);
  const supabase = await supabaseClient(token);

  const folder = "talent";
  const bucket = "resumes";
  const file = talentData.resume?.[0];
  // Generate a clean file name
  const fileName = formatResumeUrl(talentData.user_id, file);

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
export async function updateTalent(token, talentData, { user_id }) {
  const supabase = await supabaseClient(token);

  const folder = "talent";
  const bucket = "resumes";

  let resume_url = talentData.resume_url;
  const newFile = talentData.resume?.[0];

  if (newFile) {
    // A new file was uploaded → upload it
    const fileName = formatResumeUrl(user_id, newFile);

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, newFile, {
        cacheControl: "3600",
        upsert: false, // prevent overwriting
      });

    if (storageError) {
      console.error("Error uploading new resume:", storageError);
      throw new Error("Error uploading new resume");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${folder}/${fileName}`);
    resume_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from("talent_profiles") // replace with your table_name
    .update({
      level_of_experience: talentData.level_of_experience,
      industry_experience: talentData.industry_experience,
      area_of_specialization: talentData.area_of_specialization,
      linkedin_url: talentData.linkedin_url,
      portfolio_url: talentData.portfolio_url,
      resume_url: resume_url,
    })
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Talent information:", error);
    return null;
  }

  return data;
}

// Delete Talent
export async function deleteTalent(token, { user_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error deleting talent:", error);
    return data;
  }

  return data;
}

const formatResumeUrl = (user_id, file) => {
  const random = Math.floor(Math.random() * 90000);
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `resume-${random}-${user_id}.${extension}`;
  return fileName;
};
