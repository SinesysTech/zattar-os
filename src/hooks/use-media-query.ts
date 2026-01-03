import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(callback: () => void) => {
			if (typeof window === 'undefined') {
				return () => {}; // No-op cleanup for SSR
			}
			const media = window.matchMedia(query);
			media.addEventListener("change", callback);
			return () => media.removeEventListener("change", callback);
		},
		[query]
	);

	const getSnapshot = useCallback(() => {
		if (typeof window === 'undefined') {
			return false; // Return server snapshot during SSR
		}
		return window.matchMedia(query).matches;
	}, [query]);

	const getServerSnapshot = useCallback(() => {
		return false; // Default to false during SSR
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
