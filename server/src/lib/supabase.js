import { createClient } from "@supabase/supabase-js";

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || "";
const projectReference = databaseUrl.match(/postgres\.([^.]+)@/)?.[1]
  || databaseUrl.match(/@db\.([^.]+)\.supabase\.co/)?.[1];
const supabaseUrl = process.env.SUPABASE_URL || (projectReference ? `https://${projectReference}.supabase.co` : null);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const productImagesBucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images";
export const blogMediaBucket = process.env.SUPABASE_BLOG_MEDIA_BUCKET || "blog-media";
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
