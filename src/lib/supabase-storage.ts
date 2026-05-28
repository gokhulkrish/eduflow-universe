import { supabase } from "@/lib/supabase";

const DEFAULT_BUCKET = "certificates-pdfs";

export async function ensureBucketExists(bucket: string = DEFAULT_BUCKET) {
  try {
    const { data } = await supabase.storage.getBucket(bucket);
    if (data) return true;
  } catch (e) {
    // ignore
  }

  try {
    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Unable to create bucket", err);
    return false;
  }
}

export function getPublicUrl(bucket: string, path: string) {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    return null;
  }
}

export async function uploadPdf(bucket: string, path: string, file: Blob | ArrayBuffer | Buffer) {
  try {
    const body = file instanceof Blob ? file : new Blob([file], { type: "application/pdf" });
    const { data, error } = await supabase.storage.from(bucket).upload(path, body, { contentType: 'application/pdf', upsert: true });
    if (error) return { success: false, error };
    const url = getPublicUrl(bucket, path);
    return { success: true, data, url };
  } catch (e) {
    return { success: false, error: e };
  }
}

export default {
  ensureBucketExists,
  getPublicUrl,
  uploadPdf,
};
