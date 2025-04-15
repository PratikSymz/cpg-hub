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

// Add Brand
export async function addNewBrand(token, _, brandData) {
  const supabase = await supabaseClient(token);
  console.log(brandData);

  const random = Math.floor(Math.random() * 90000);
  const file = brandData.logo?.[0];
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const safeName = brandData.brand_name
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const fileName = `logo-${random}-${safeName}.${extension}`;

  // Upload the file
  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(`brands/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (storageError) throw new Error("Error uploading Brand Logo");

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from("company-logo")
    .getPublicUrl(`brands/${fileName}`);
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
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Brand");
  }

  return data;
}
