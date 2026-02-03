/// <reference types="vite/client" />

import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Get the URL for a Supabase Edge Function
 * @param {string} functionName - The name of the edge function
 * @returns {string} The full URL to the edge function
 */
export const getEdgeFunctionUrl = (functionName) =>
  `${supabaseUrl}/functions/v1/${functionName}`;

const supabaseClient =  (supabaseAccessToken) => {
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
