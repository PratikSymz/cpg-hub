/// <reference types="vite/client" />

import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;

const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    supabaseAccessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${supabaseAccessToken}`,
            },
          },
        }
      : {}
  );

  return supabase;
};

export default supabaseClient;
