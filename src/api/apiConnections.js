import supabaseClient from "@/utils/supabase.js";

const table_name = "connections";
export async function sendConnectionRequest({
  requester_id,
  target_id,
  message,
  role_a,
  role_b,
}) {
  const supabase = await supabaseClient();
  const { data, error } = await supabase.from(table_name).insert([
    {
      requester_id,
      target_id,
      message,
      role_a,
      role_b,
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
