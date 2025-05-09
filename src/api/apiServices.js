import supabaseClient from "@/utils/supabase.js";

const table_name = "broker_profiles";

// Read All Services
export async function getServices(
  token,
  { category_of_service, markets_covered, search_query }
) {
  const supabase = await supabaseClient(token);

  let query = supabase.from(table_name).select("*");

  if (category_of_service) {
    query = query.ilike("category_of_service", `%${category_of_service}%`);
  }

  if (markets_covered) {
    query = query.ilike("markets_covered", `%${markets_covered}%`);
  }

  const safeQuery = search_query.replace(/[%_]/g, "\\$&");
  if (search_query) {
    query = query.or(`company_name.ilike.%${safeQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching services: ", error);
    return null;
  }

  return data;
}

// Read Single Service
export async function getSingleService(token, { broker_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from(table_name)
    .select(
      `*,
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`
    )
    .eq("id", broker_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Service:", error);
    return null;
  }

  return data;
}

// - Post Service
export async function addNewService(token, serviceData) {
  const supabase = await supabaseClient(token);

  const folder = "services";
  const random = Math.floor(Math.random() * 90000);
  const file = serviceData.logo?.[0];
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const safeName = serviceData.company_name
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const fileName = `logo-${random}-${safeName}.${extension}`;

  // Upload the file
  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(`${folder}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (storageError) throw new Error("Error uploading Service Company Logo");

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from("company-logo")
    .getPublicUrl(`${folder}/${fileName}`);
  const logo_url = publicUrlData?.publicUrl;

  const { data, error } = await supabase
    .from(table_name)
    .insert([
      {
        company_name: serviceData.company_name,
        company_website: serviceData.company_website,
        logo_url: logo_url,
        num_employees: serviceData.num_employees,
        area_of_specialization: serviceData.area_of_specialization,
        category_of_service: serviceData.category_of_service,
        type_of_broker_service: serviceData.type_of_broker_service,
        markets_covered: serviceData.markets_covered,
        customers_covered: serviceData.customers_covered,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Service");
  }

  return data;
}

// Delete Service
// export async function deleteJob(token, { job_id }) {
//   const supabase = await supabaseClient(token);

//   const { data, error: deleteError } = await supabase
//     .from("jobs")
//     .delete()
//     .eq("id", job_id)
//     .select();

//   if (deleteError) {
//     console.error("Error deleting job:", deleteError);
//     return data;
//   }

//   return data;
// }
