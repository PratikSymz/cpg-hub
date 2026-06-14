import supabaseClient from "@/utils/supabase.js";
import { uploadToBucket } from "@/utils/storage.js";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "@/constants/storage.js";

const TABLE_NAME = "talent_profiles";
const TALENT_SELECT = `*,
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`;

const uploadResume = (supabase, file, identifier) =>
  uploadToBucket(supabase, {
    bucket: STORAGE_BUCKETS.RESUMES,
    folder: STORAGE_FOLDERS.TALENT,
    file,
    prefix: "resume",
    identifier,
  });

const talentColumns = (talentData, resume_url) => ({
  level_of_experience: talentData.level_of_experience,
  industry_experience: talentData.industry_experience,
  area_of_specialization: talentData.area_of_specialization,
  linkedin_url: talentData.linkedin_url,
  portfolio_url: talentData.portfolio_url,
  resume_url,
});

export async function getAllTalent(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase.from(TABLE_NAME).select(TALENT_SELECT);

  if (error) {
    console.error("Supabase error:", error.message, error.details);
  }
  return data;
}

export async function getTalent(token, { talent_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(TALENT_SELECT)
    .eq("id", talent_id)
    .single();

  if (error) {
    console.error(`Error fetching Talent ${talent_id}:`, error);
    return null;
  }
  return data;
}

export async function getMyTalentProfile(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(TALENT_SELECT)
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching my profile ${user_id}:`, error);
    return null;
  }
  return data;
}

export async function addNewTalent(token, talentData) {
  const supabase = supabaseClient(token);

  const file = talentData.resume?.[0];
  const resume_url = file
    ? await uploadResume(supabase, file, talentData.user_id)
    : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ user_id: talentData.user_id, ...talentColumns(talentData, resume_url) }])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Talent");
  }
  return data;
}

export async function updateTalent(token, talentData, { user_id }) {
  const supabase = supabaseClient(token);

  let resume_url = talentData.resume_url;
  const newFile = talentData.resume?.[0];
  if (newFile) resume_url = await uploadResume(supabase, newFile, user_id);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(talentColumns(talentData, resume_url))
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Talent information:", error);
    return null;
  }
  return data;
}

export async function updateTalentById(token, talentData, { talent_id }) {
  const supabase = supabaseClient(token);

  let resume_url = talentData.resume_url;
  const newFile = talentData.resume?.[0];
  if (newFile) resume_url = await uploadResume(supabase, newFile, talent_id);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(talentColumns(talentData, resume_url))
    .eq("id", talent_id)
    .select();

  if (error) {
    console.error("Error Updating Talent information:", error);
    return null;
  }
  return data;
}

export async function deleteTalent(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("user_id", user_id)
    .select();

  if (error) console.error("Error Deleting Talent:", error);
  return data;
}

export async function deleteTalentById(token, { talent_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", talent_id)
    .select();

  if (error) console.error("Error Deleting Talent:", error);
  return data;
}
