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
      const response = await callback(supabaseAccessToken, options, ...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, func: func };
};

export default useFetch;
