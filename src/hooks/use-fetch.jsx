import { useSession } from "@clerk/clerk-react";
import { useState } from "react";

const useFetch = (callback, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const { session } = useSession();

  const func = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const supabaseAccessToken = session
        ? await session.getToken({ template: "supabase" })
        : null;
      const response = await callback(supabaseAccessToken, ...args);
      setData(response);
      setError(null);
      return { data: response, error: null }; // Return success
    } catch (error) {
      setError(error);
      return { data: null, error }; // Return error
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, func: func };
};

export default useFetch;
