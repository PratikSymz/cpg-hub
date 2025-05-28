import supabaseClient from "@/utils/supabase.js";

const table_name = "endorsements";

// Get all endorsements for this user (user_id)
export async function getAllEndorsements(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(
      `
      id,
      message,
      created_at,
      endorser:from_user_id (
        user_id,
        full_name,
        email,
        profile_picture_url
      ),
      target:to_user_id (
        user_id,
        full_name,
        email,
        profile_picture_url
      )
    `
    )
    .eq("to_user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching endorsements:", error);
    return null;
  }

  return data;
}

// Create/Update an endorsement
export async function updateEndorsement(
  token,
  new_message,
  { endorser_id, target_id }
) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .upsert(
      {
        from_user_id: endorser_id,
        to_user_id: target_id,
        message: new_message,
      },
      { onConflict: "from_user_id,to_user_id" }
    )
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error updating endorsement message");
  }

  return data;
}

export async function deleteEndorsement(token, { endorser_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("from_user_id", endorser_id);

  if (error) {
    console.error(error);
    throw new Error("Error deleting endorsement");
  }
  return data;
}
