import { useCallback, useSyncExternalStore, useState } from "react";

export function useDisclosure({
	defaultIsOpen = false,
}: {
	defaultIsOpen?: boolean;
} = {}) {
	const [isOpen, setIsOpen] = useState(defaultIsOpen);

	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);
	const onToggle = () => setIsOpen((currentValue) => !currentValue);

	return { onOpen, onClose, isOpen, onToggle };
}

export const useLocalStorage = <T>(
	key: string,
	initialValue: T,
): [T, (value: T) => void] => {
	const readValue = (): T => {
		if (typeof window === "undefined") {
			return initialValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	};

	const [storedValue, setStoredValue] = useState<T>(readValue);

	const setValue = (value: T) => {
		try {
			const valueToStore =
				value instanceof Function ? value(storedValue) : value;
			setStoredValue(valueToStore);
			if (typeof window !== "undefined") {
				window.localStorage.setItem(key, JSON.stringify(valueToStore));
			}
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error);
		}
	};

	return [storedValue, setValue];
};

export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(callback: () => void) => {
			const media = window.matchMedia(query);
			media.addEventListener("change", callback);
			return () => media.removeEventListener("change", callback);
		},
		[query]
	);

	const getSnapshot = useCallback(() => {
		return window.matchMedia(query).matches;
	}, [query]);

	const getServerSnapshot = useCallback(() => {
		return false; // Default to false during SSR
	}, []);

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
