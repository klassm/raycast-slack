import { useEffect, useState, useMemo } from "react";
import { CacheOptions, CacheProvider, getCachedData, updateCache } from "../utils/cache";

export function useCache<T>(key: string, provider: CacheProvider<T>, options: CacheOptions) {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const reloadData = useMemo(
    () => () => {
      setLoading(true);
      getCachedData(key, provider, options)
        .then(setData)
        .finally(() => setLoading(false));
    },
    [getCachedData, setLoading]
  );

  const update = useMemo(
    () => (newData: T) => {
      updateCache(key, newData);
      reloadData();
    },
    [updateCache, reloadData]
  );
  useEffect(reloadData, []);

  return {
    data,
    loading,
    update,
  };
}
