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
    query = query.contains("category_of_service", category_of_service);
  }

  if (markets_covered) {
    query = query.contains("markets_covered", markets_covered);
  }

  if (search_query) {
    query = query.ilike("company_name", `%${search_query}%`);
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
    .select("*")
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
export async function addNewService(token, _, serviceData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .insert([serviceData])
    .select()
    .single();

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
