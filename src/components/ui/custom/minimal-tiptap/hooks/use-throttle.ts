import {useRef, useCallback} from 'react'

export function useThrottle<T extends (...args: never[]) => void>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const lastRan = useRef<number | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    return useCallback(
        (...args: Parameters<T>) => {
            const handler = () => {
                const now = Date.now()
                const lastRanTime = lastRan.current
                
                if (lastRanTime === null || now - lastRanTime >= delay) {
                    callback(...args)
                    lastRan.current = now
                } else {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                    }
                    timeoutRef.current = setTimeout(
                        () => {
                            callback(...args)
                            lastRan.current = Date.now()
                        },
                        delay - (now - lastRanTime)
                    )
                }
            }

            handler()
        },
        [callback, delay]
    )
}
