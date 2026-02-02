import { useState, useEffect, useCallback } from 'react';
import {
  fetchCompanySuggestions,
  type CompanySuggestion,
} from '../lib/services';

interface UseCompanyAutocompleteResult {
  suggestions: CompanySuggestion[];
  isLoading: boolean;
  error: string | null;
}

export const useCompanyAutocomplete = (
  query: string,
  debounceMs = 300,
): UseCompanyAutocompleteResult => {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(
    async (searchQuery: string, signal: AbortSignal) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          'useCompanyAutocomplete - fetching for query:',
          searchQuery,
        );
        const results = await fetchCompanySuggestions(searchQuery, signal);
        console.log('useCompanyAutocomplete - results:', results);
        setSuggestions(results);
      } catch (err: any) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('useCompanyAutocomplete - error:', err);
        setError('Failed to fetch company suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      fetchSuggestions(query, controller.signal);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [query, debounceMs, fetchSuggestions]);

  return { suggestions, isLoading, error };
};
