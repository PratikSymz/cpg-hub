import supabaseClient from "@/utils/supabase.js";

const table_name = "connections";

export async function getConnectionStatus(token, { requester_id, target_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(`*`)
    .eq("requester_id", requester_id)
    .eq("target_id", target_id)
    .single();

  if (error) {
    console.error(`Error fetching connection status ${requester_id}:`, error);
    return null;
  }

  return data;
}

export async function sendConnectionRequest({
  token,
  requester_id,
  target_id,
  message,
}) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase.from(table_name).insert([
    {
      requester_id,
      target_id,
      message,
    },
  ]);

  if (error) {
    console.error(error);
    throw new Error("Error sending connection request");
  }

  return data;
}

// Get all connections requests for this talent
export async function getRequestsForTalent(token, { target_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(
      `
      id,
      message,
      status,
      created_at,
      requester:requester_id (
        user_id,
        full_name,
        email,
        profile_picture_url
      ),
      target:target_id (
        user_id,
        full_name,
        email,
        profile_picture_url
      )
    `
    )
    .eq("target_id", target_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching connection requests:", error);
    return null;
  }

  return data;
}

export async function updateConnectionStatus(
  token,
  new_status,
  { requester_id, target_id }
) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .update({ status: new_status })
    .eq("requester_id", requester_id)
    .eq("target_id", target_id)
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error updating connection request");
  }

  return data;
}

export async function deleteConnection(id) {
  const supabase = await supabaseClient();

  const { data, error } = await supabase.from(table_name).delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Error deleting connection");
  }
  return data;
}
