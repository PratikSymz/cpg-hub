const buildFileName = (prefix, identifier, file) => {
  const random = Math.floor(Math.random() * 90000);
  const ext = file.name.split(".").pop().toLowerCase();
  return `${prefix}-${random}-${identifier}.${ext}`;
};

export async function uploadToBucket(
  supabase,
  { bucket, folder, file, prefix, identifier }
) {
  const fileName = buildFileName(prefix, identifier, file);
  const path = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) {
    console.error(`Storage upload failed for ${bucket}/${path}:`, error);
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
