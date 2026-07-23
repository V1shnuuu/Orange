import { useState, useEffect } from 'react';

/**
 * Custom hook to subscribe to media query changes
 * 
 * @param query CSS media query string (e.g. '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    const updateMatches = () => setMatches(media.matches);

    updateMatches();

    media.addEventListener('change', updateMatches);
    return () => media.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}
