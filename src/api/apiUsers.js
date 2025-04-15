import supabaseClient from "@/utils/supabase.js";

const table_name = "talent_profiles";

// Fetch Brands
export async function getAllTalent(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.from(table_name).select("*");

  if (error) {
    console.error("Error fetching Talents:", error);
    return null;
  }

  return data;
}

// Fetch single Talent
export async function getTalent(token, id) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) {
    console.error(`Error fetching Talent ${id}:`, error);
    return null;
  }

  return data;
}

// Add Talent
export async function addNewTalent(token, _, talentData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .insert([talentData])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Talent");
  }

  return data;
}

// Update Talent Info
export async function updateTalent(token, talent_id, talent_data) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .update(talent_data)
    .eq("id", talent_id)
    .select();

  if (error) {
    console.error("Error Updating Talent information:", error);
    return null;
  }

  return data;
}

// Delete Talent
export async function deleteTalent(token, talent_id) {
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
