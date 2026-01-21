import supabaseClient from "@/utils/supabase.js";

const table_name = "broker_profiles";

// Read All Services
export async function getServices(
  token,
  { category_of_service, markets_covered, search_query }
) {
  const supabase = supabaseClient(token);

  let query = supabase.from(table_name).select("*");

  // if (category_of_service) {
  //   query = query.contains("category_of_service", [category_of_service]);
  // }

  // if (markets_covered) {
  //   query = query.contains("markets_covered", [markets_covered]);
  // }

  // const safeQuery = search_query.replace(/[%_]/g, "\\$&");
  // if (search_query) {
  //   query = query.or(`company_name.ilike.%${safeQuery}%`);
  // }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching services: ", error);
    return null;
  }

  return data;
}

// Read Single Service
export async function getSingleService(token, { broker_id }) {
  const supabase = supabaseClient(token);
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

// Fetch my profile
export async function getMyServiceProfile(token, { user_id }) {
  const supabase = supabaseClient(token);
  const { data, error } = await supabase
    .from(table_name)
    .select(
      `*,
      user_info: user_profiles (user_id, full_name, email, profile_picture_url)`
    )
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching my profile ${user_id}:`, error);
    return null;
  }

  return data;
}

// - Post Service
export async function addNewService(token, serviceData) {
  const supabase = supabaseClient(token);

  // Company logo url
  let company_logo_url = null;
  const file = serviceData.logo?.[0];

  const folder = "services";
  const bucket = "company-logo";
  if (file) {
    // A new file was uploaded → upload it
    const fileName = formatCompanyLogoUrl(serviceData.user_id, file);

    // Upload the file
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Error uploading new Service logo:", storageError);
      throw new Error("Error uploading Service Company Logo");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${folder}/${fileName}`);
    company_logo_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from(table_name)
    .insert([
      {
        company_name: serviceData.company_name,
        company_website: serviceData.company_website,
        logo_url: company_logo_url,
        num_employees: serviceData.num_employees,
        area_of_specialization: serviceData.area_of_specialization,
        category_of_service: serviceData.category_of_service,
        is_broker: serviceData.is_broker,
        type_of_broker_service: serviceData.type_of_broker_service,
        markets_covered: serviceData.markets_covered,
        customers_covered: serviceData.customers_covered,
        user_id: serviceData.user_id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Service");
  }

  return data;
}

// - Post Service
export async function updateService(token, serviceData, { user_id }) {
  const supabase = supabaseClient(token);

  // Current company logo url
  let company_logo_url = serviceData.logo_url;
  const newFile = serviceData.logo?.[0];

  const folder = "services";
  const bucket = "company-logo";
  if (newFile) {
    // A new file was uploaded → upload it
    const fileName = formatCompanyLogoUrl(serviceData.user_id, newFile);

    // Upload the file
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, newFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Error uploading new Service logo:", storageError);
      throw new Error("Error uploading Service Company Logo");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${folder}/${fileName}`);
    company_logo_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from(table_name)
    .update({
      company_name: serviceData.company_name,
      company_website: serviceData.company_website,
      logo_url: company_logo_url,
      num_employees: serviceData.num_employees,
      area_of_specialization: serviceData.area_of_specialization,
      category_of_service: serviceData.category_of_service,
      is_broker: serviceData.is_broker,
      type_of_broker_service: serviceData.type_of_broker_service,
      markets_covered: serviceData.markets_covered,
      customers_covered: serviceData.customers_covered,
      user_id: serviceData.user_id,
    })
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error Updating Service information:", error);
    throw new Error("Error Updating Service information:", error);
  }

  return data;
}

// Delete Service
export async function deleteService(token, { user_id }) {
  const supabase = supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("user_id", user_id)
    .select();

  if (error) {
    console.error("Error deleting service:", error);
    return data;
  }

  return data;
}

// Update Service by ID (for admin/owner editing any profile by ID)
export async function updateServiceById(token, serviceData, { service_id }) {
  const supabase = supabaseClient(token);

  // Current company logo url
  let company_logo_url = serviceData.logo_url;
  const newFile = serviceData.logo?.[0];

  const folder = "services";
  const bucket = "company-logo";
  if (newFile) {
    // A new file was uploaded → upload it
    const fileName = formatCompanyLogoUrl(service_id, newFile);

    // Upload the file
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(`${folder}/${fileName}`, newFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError) {
      console.error("Error uploading new Service logo:", storageError);
      throw new Error("Error uploading Service Company Logo");
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${folder}/${fileName}`);
    company_logo_url = publicUrlData?.publicUrl;
  }

  const { data, error } = await supabase
    .from(table_name)
    .update({
      company_name: serviceData.company_name,
      company_website: serviceData.company_website,
      logo_url: company_logo_url,
      num_employees: serviceData.num_employees,
      area_of_specialization: serviceData.area_of_specialization,
      category_of_service: serviceData.category_of_service,
      is_broker: serviceData.is_broker,
      type_of_broker_service: serviceData.type_of_broker_service,
      markets_covered: serviceData.markets_covered,
      customers_covered: serviceData.customers_covered,
    })
    .eq("id", service_id)
    .select();

  if (error) {
    console.error("Error Updating Service information:", error);
    return null;
  }

  return data;
}

// Delete Service by ID (for admin/owner deleting any profile by ID)
export async function deleteServiceById(token, { service_id }) {
  const supabase = supabaseClient(token);

  const { data, error } = await supabase
    .from(table_name)
    .delete()
    .eq("id", service_id)
    .select();

  if (error) {
    console.error("Error deleting service:", error);
    return data;
  }

  return data;
}

const formatCompanyLogoUrl = (user_id, file) => {
  const random = Math.floor(Math.random() * 90000);
  // Get a safe file extension
  const extension = file.name.split(".").pop().toLowerCase();
  // Generate a clean file name
  const fileName = `company-${random}-${user_id}.${extension}`;
  return fileName;
};
