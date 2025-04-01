import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

// Custom hook to handle debounced loading state
export const useLoadingDebounce = (isLoading, delay = 1000) => {
  const [debouncedLoading, setDebouncedLoading] = useState(false);
  const debouncedFnRef = useRef(null);

  useEffect(() => {
    // Create debounced function only once
    if (!debouncedFnRef.current) {
      debouncedFnRef.current = debounce(
        (loading) => {
          setDebouncedLoading(loading);
        },
        delay
      );
    }

    // If loading starts, update immediately
    if (isLoading) {
      setDebouncedLoading(true);
    } else {
      // If loading stops, debounce the state change
      debouncedFnRef.current(false);
    }

    return () => {
      // Cancel debounced function on cleanup
      debouncedFnRef.current?.cancel();
    };
  }, [isLoading, delay]);

  return debouncedLoading;
};

export default useLoadingDebounce; 