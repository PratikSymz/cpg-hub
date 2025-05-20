import supabaseClient from "@/utils/supabase.js";

const table_name = "talent_experiences";

// Fetch all Experiences
export async function getAllExperiences(token, { user_id }) {
  const supabase = await supabaseClient(token);

  // Talent Function field
  let query = supabase.from(table_name).select("*").eq("user_id", user_id);

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error.message);
    console.error("Details:", error.details);
  }

  return data;
}

// Add a new Experience
export async function addNewExperience(token, experienceData, { user_id }) {
  const supabase = await supabaseClient(token);

  const file = experienceData.logo?.[0];
  const folder = "talent";
  const bucket = "brands-experience";
  // A new file was uploaded → upload it
  const fileName = formatBrandLogoUrl(user_id, file);

  // Upload the file
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(`${folder}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false, // prevent overwriting
    });

  if (storageError) {
    console.error("Error uploading new Brand logo:", storageError);
    throw new Error("Error uploading new Brand logo");
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(`${folder}/${fileName}`);
  const brand_logo_url = publicUrlData?.publicUrl;

  const { data, error } = await supabase
    .from(table_name)
    .insert([
      {
        brand_name: experienceData.brand_name,
        brand_website: experienceData.website,
        brand_logo: brand_logo_url,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Brand Experience");
  }

  return data;
}

// Update Experience Info
export async function updateExperience(
  token,
  experienceData,
  { user_id, experience_id }
) {
  const supabase = await supabaseClient(token);

  const folder = "talent";
  const bucket = "brands-experience";
  let brand_logo_url = experienceData.brand_logo;
  const newFile = experienceData.brand_logo?.[0];

  if (newFile) {
    // A new file was uploaded → upload it
    const fileName = formatBrandLogoUrl(user_id, newFile);

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, newFile, {
        cacheControl: "3600",
        upsert: false, // prevent overwriting
      });

    if (storageError) {
      console.error("Error uploading new Brand logo:", storageError);
      throw new Error("Error uploading new Brand logo");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${folder}/${fileName}`);
    brand_logo_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from(table_name)
    .update({
      brand_name: experienceData.brand_name,
      brand_website: experienceData.website,
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

// Delete Experience
export async function deleteExperience(token, { experience_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("id", experience_id)
    .select();

  if (error) {
    console.error("Error deleting experience:", error);
    return data;
  }

  return data;
}

const formatBrandLogoUrl = (user_id, file) => {
  const random = Math.floor(Math.random() * 90000);
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `brand-${random}-${user_id}.${extension}`;
  return fileName;
};
