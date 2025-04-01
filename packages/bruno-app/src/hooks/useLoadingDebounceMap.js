import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';

// Custom hook to handle debounced loading state for multiple items
export const useLoadingDebounceMap = (items, getItemId, getIsItemLoading, delay = 1000) => {
  const [debouncedLoadingState, setDebouncedLoadingState] = useState({});
  const debouncedFunctionsRef = useRef({});

  useEffect(() => {
    // Process each item
    const newState = { ...debouncedLoadingState };
    let hasChanges = false;

    (items || []).forEach(item => {
      const itemId = getItemId(item);
      const isLoading = getIsItemLoading(item);

      // Create a debounced function for this item if it doesn't exist
      if (!debouncedFunctionsRef.current[itemId]) {
        debouncedFunctionsRef.current[itemId] = debounce((loading) => {
          setDebouncedLoadingState(prev => ({
            ...prev,
            [itemId]: loading
          }));
        }, delay);
      }

      // If item is loading, update immediately
      if (isLoading) {
        if (!newState[itemId]) {
          newState[itemId] = true;
          hasChanges = true;
        }
      } else if (newState[itemId]) {
        // If item is no longer loading, use the debounced function
        debouncedFunctionsRef.current[itemId](false);
      }
    });

    if (hasChanges) {
      setDebouncedLoadingState(newState);
    }

    // Cleanup
    return () => {
      Object.values(debouncedFunctionsRef.current).forEach(debouncedFn => {
        debouncedFn.cancel();
      });
    };
  }, [items, getItemId, getIsItemLoading, delay]);

  return debouncedLoadingState;
};

export default useLoadingDebounceMap; 