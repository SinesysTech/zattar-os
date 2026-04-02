// This hook is largely superseded by the Server Component approach in ProfileShell.
// However, if kept for client-side only transitions or updates, it should be careful about importing server actions directly
// if they are not meant for client bundles (though Next.js handles 'use server' imports fine).
// For the purpose of the refactor request "remove direct import ... Transform ProfileShell to server component",
// this hook is no longer the primary driver.
// I will start it empty/deprecated to prompt usage of Server Components.

interface UseProfileDataResult {
  data: unknown;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * @deprecated Use ProfileShell Server Component instead
 */
export function useProfileData(): UseProfileDataResult {
  console.warn(
    "useProfileData is deprecated. Use ProfileShell Server Component."
  );

  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
