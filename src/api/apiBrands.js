import supabaseClient, { supabaseUrl } from "@/utils/supabase.js";

const table_name = "brand_profiles";

// Fetch Brands
export async function getAllBrands(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.from(table_name).select("*");

  if (error) {
    console.error("Error fetching Brands:", error);
    return null;
  }

  return data;
}

// Fetch single Brand
export async function getBrand(token, id) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) {
    console.error(`Error fetching Brand ${id}:`, error);
    return null;
  }

  return data;
}

// Fetch my profile
export async function getMyBrandProfile(token, { user_id }) {
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

// Add Brand
export async function addNewBrand(token, _, brandData) {
  const supabase = await supabaseClient(token);

  const file = brandData.logo?.[0];
  const folder = "brands";
  const bucket = "company-logo";
  // A new file was uploaded → upload it
  const fileName = formatCompanyLogoUrl(brandData.user_id, file);

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
  const logo_url = publicUrlData?.publicUrl;

  const { data, error } = await supabase
    .from(table_name)
    .insert([
      {
        brand_name: brandData.brand_name,
        website: brandData.website,
        linkedin_url: brandData.linkedin_url,
        brand_hq: brandData.brand_hq,
        logo_url: logo_url,
        brand_desc: brandData.brand_desc,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Brand");
  }

  return data;
}

// Update Brand Info
export async function updateBrand(token, brandData, { user_id }) {
  const supabase = await supabaseClient(token);

  // Current company logo url
  let company_logo_url = brandData.logo_url;
  const newFile = brandData.logo?.[0];

  const folder = "brands";
  const bucket = "company-logo";
  if (newFile) {
    // A new file was uploaded → upload it
    const fileName = formatCompanyLogoUrl(user_id, newFile);

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
    company_logo_url = publicUrlData?.publicUrl;
  }


  const { data, error } = await supabase
    .from(table_name)
    .update({
      brand_name: brandData.brand_name,
      website: brandData.website,
      linkedin_url: brandData.linkedin_url,
      brand_hq: brandData.brand_hq,
      logo_url: company_logo_url,
      brand_desc: brandData.brand_desc,
    })
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Brand information:", error);
    return null;
  }

  return data;
}

const formatCompanyLogoUrl = (user_id, file) => {
  const random = Math.floor(Math.random() * 90000);
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `resume-${random}-${user_id}.${extension}`;
  return fileName;
};
