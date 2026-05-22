import supabaseClient from "@/utils/supabase.js";
import { uploadToBucket } from "@/utils/storage.js";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "@/constants/storage.js";

const TABLE_NAME = "talent_experiences";

const uploadBrandLogo = (supabase, file, identifier) =>
  uploadToBucket(supabase, {
    bucket: STORAGE_BUCKETS.BRANDS_EXPERIENCE,
    folder: STORAGE_FOLDERS.TALENT,
    file,
    prefix: "brand",
    identifier,
  });

export async function getAllExperiences(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", user_id);

  if (error) {
    console.error("Supabase error:", error.message, error.details);
  }
  return data;
}

export async function addNewExperience(token, experienceData, { user_id }) {
  const supabase = supabaseClient(token);

  const file = experienceData.brand_logo?.[0];
  const brand_logo_url = file
    ? await uploadBrandLogo(supabase, file, user_id)
    : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        brand_name: experienceData.brand_name,
        brand_website: experienceData.brand_website,
        brand_logo: brand_logo_url,
        user_id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Brand Experience");
  }
  return data;
}

export async function updateExperience(
  token,
  experienceData,
  { user_id, experience_id }
) {
  const supabase = supabaseClient(token);

  let brand_logo_url = experienceData.brand_logo;
  const newFile = experienceData.brand_logo?.[0];
  if (newFile) brand_logo_url = await uploadBrandLogo(supabase, newFile, user_id);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      brand_name: experienceData.brand_name,
      brand_website: experienceData.brand_website,
      brand_logo: brand_logo_url,
    })
    .eq("id", experience_id)
    .select();

  if (error) {
    console.error("Error Updating Experience information:", error);
    return null;
  }
  return data;
}

export async function deleteExperience(token, { experience_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", experience_id)
    .select();

  if (error) console.error("Error deleting experience:", error);
  return data;
}
