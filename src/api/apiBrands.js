import supabaseClient from "@/utils/supabase.js";
import { uploadToBucket } from "@/utils/storage.js";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "@/constants/storage.js";

const TABLE_NAME = "brand_profiles";

const uploadBrandLogo = (supabase, file, identifier) =>
  uploadToBucket(supabase, {
    bucket: STORAGE_BUCKETS.COMPANY_LOGO,
    folder: STORAGE_FOLDERS.BRANDS,
    file,
    prefix: "company",
    identifier,
  });

export async function getAllBrands(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) {
    console.error("Error fetching Brands:", error);
    return null;
  }
  return data;
}

export async function getBrand(token, { brand_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", brand_id)
    .single();

  if (error) {
    console.error(`Error fetching Brand ${brand_id}:`, error);
    return null;
  }
  return data;
}

export async function getMyBrandProfile(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
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

export async function getMyBrands(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching brands for user ${user_id}:`, error);
    return [];
  }
  return data || [];
}

export async function addNewBrand(token, brandData) {
  const supabase = supabaseClient(token);

  const file = brandData.logo?.[0];
  const logo_url = file
    ? await uploadBrandLogo(supabase, file, brandData.user_id)
    : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        brand_name: brandData.brand_name,
        website: brandData.website,
        linkedin_url: brandData.linkedin_url,
        brand_hq: brandData.brand_hq,
        logo_url,
        user_id: brandData.user_id,
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

export async function updateBrand(token, brandData, { user_id }) {
  const supabase = supabaseClient(token);

  let logo_url = brandData.logo_url;
  const newFile = brandData.logo?.[0];
  if (newFile) {
    logo_url = await uploadBrandLogo(supabase, newFile, user_id);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      brand_name: brandData.brand_name,
      website: brandData.website,
      linkedin_url: brandData.linkedin_url,
      brand_hq: brandData.brand_hq,
      logo_url,
      brand_desc: brandData.brand_desc,
    })
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Brand information:", error);
    throw new Error("Error Updating Brand information");
  }
  return data;
}

export async function updateBrandById(token, { brand_id, brandData, newLogo }) {
  const supabase = supabaseClient(token);

  let logo_url = brandData.logo_url;
  if (newLogo instanceof File) {
    logo_url = await uploadBrandLogo(supabase, newLogo, brand_id);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      brand_name: brandData.brand_name,
      website: brandData.website,
      linkedin_url: brandData.linkedin_url,
      brand_hq: brandData.brand_hq,
      logo_url,
      brand_desc: brandData.brand_desc,
    })
    .eq("id", brand_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating Brand:", error);
    throw new Error("Error updating Brand");
  }

  // Mirror updated brand info onto all jobs linked to this brand so listings
  // stay in sync with the latest brand details (denormalized for read perf).
  const { error: jobsError } = await supabase
    .from("job_listings")
    .update({
      poster_name: brandData.brand_name,
      poster_logo: logo_url,
      poster_location: brandData.brand_hq,
    })
    .eq("brand_id", brand_id);

  if (jobsError) console.error("Error syncing jobs:", jobsError);

  return data;
}

export async function deleteBrand(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("user_id", user_id)
    .select();

  if (error) console.error("Error deleting Brand:", error);
  return data;
}
