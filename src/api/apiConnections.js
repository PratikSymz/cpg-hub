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

export async function updateConnectionStatus(id, new_status) {
  const supabase = await supabaseClient();
  const { data, error } = await supabase
    .from(table_name)
    .update({ status: new_status })
    .eq("id", id)
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
