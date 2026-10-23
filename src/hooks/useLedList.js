import { useEffect, useState, useCallback } from "react";

// Fetches data via `loader()` (returns a promise), exposes a `reload` trigger.
export function useLedList(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loader()
      .then((r) => { if (active) setData(r); }, () => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, loading, reload };
}