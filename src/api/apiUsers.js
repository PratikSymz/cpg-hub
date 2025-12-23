import supabaseClient from "@/utils/supabase.js";

const table_name = "user_profiles";

export async function syncUserProfile(
  token,
  { user_id, full_name, email, profile_picture_url }
) {
  const supabase = supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .upsert(
      {
        user_id,
        full_name,
        email,
        profile_picture_url,
      },
      { onConflict: "user_id" }
    )
    .select();

  if (error) {
    console.error("Error syncing user profile:", error.message);
    return data;
  }

  return data;
}

export async function getUser(token, { user_id }) {
  const supabase = supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) {
    console.error(`Error fetching user ${user_id}:`, error);
    return null;
  }

  return data;
}
