"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` after it has been stable for `delay` ms.
 * Used for debounced search inputs and expensive queries.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
