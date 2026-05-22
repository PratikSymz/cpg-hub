import supabaseClient from "@/utils/supabase.js";
import { uploadToBucket } from "@/utils/storage.js";
import { STORAGE_BUCKETS, STORAGE_FOLDERS } from "@/constants/storage.js";

const TABLE_NAME = "broker_profiles";
const SERVICE_SELECT = `*,
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`;

const uploadServiceLogo = (supabase, file, identifier) =>
  uploadToBucket(supabase, {
    bucket: STORAGE_BUCKETS.COMPANY_LOGO,
    folder: STORAGE_FOLDERS.SERVICES,
    file,
    prefix: "company",
    identifier,
  });

const serviceColumns = (serviceData, logo_url) => ({
  company_name: serviceData.company_name,
  company_website: serviceData.company_website,
  logo_url,
  num_employees: serviceData.num_employees,
  area_of_specialization: serviceData.area_of_specialization,
  category_of_service: serviceData.category_of_service,
  is_broker: serviceData.is_broker,
  type_of_broker_service: serviceData.type_of_broker_service,
  markets_covered: serviceData.markets_covered,
  customers_covered: serviceData.customers_covered,
});

export async function getServices(token) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase.from(TABLE_NAME).select("*");

  if (error) {
    console.error("Error fetching services:", error);
    return null;
  }
  return data;
}

export async function getSingleService(token, { broker_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SERVICE_SELECT)
    .eq("id", broker_id)
    .single();

  if (error) {
    console.error("Error fetching Service:", error);
    return null;
  }
  return data;
}

export async function getMyServiceProfile(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SERVICE_SELECT)
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching my profile ${user_id}:`, error);
    return null;
  }
  return data;
}

export async function addNewService(token, serviceData) {
  const supabase = supabaseClient(token);

  const file = serviceData.logo?.[0];
  const logo_url = file
    ? await uploadServiceLogo(supabase, file, serviceData.user_id)
    : null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        user_id: serviceData.user_id,
        ...serviceColumns(serviceData, logo_url),
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Service");
  }
  return data;
}

export async function updateService(token, serviceData, { user_id }) {
  const supabase = supabaseClient(token);

  let logo_url = serviceData.logo_url;
  const newFile = serviceData.logo?.[0];
  if (newFile) logo_url = await uploadServiceLogo(supabase, newFile, user_id);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ user_id: serviceData.user_id, ...serviceColumns(serviceData, logo_url) })
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Service information:", error);
    throw new Error("Error Updating Service information");
  }
  return data;
}

export async function updateServiceById(token, serviceData, { service_id }) {
  const supabase = supabaseClient(token);

  let logo_url = serviceData.logo_url;
  const newFile = serviceData.logo?.[0];
  if (newFile) logo_url = await uploadServiceLogo(supabase, newFile, service_id);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(serviceColumns(serviceData, logo_url))
    .eq("id", service_id)
    .select();

  if (error) {
    console.error("Error Updating Service information:", error);
    return null;
  }
  return data;
}

export async function deleteService(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("user_id", user_id)
    .select();

  if (error) console.error("Error deleting service:", error);
  return data;
}

export async function deleteServiceById(token, { service_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", service_id)
    .select();

  if (error) console.error("Error deleting service:", error);
  return data;
}
