'use client'

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pedrinho-threads'
const MAX_THREADS = 20

export interface ThreadEntry {
  id: string
  title: string
  createdAt: string
}

function loadThreads(): ThreadEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveThreads(threads: ThreadEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, MAX_THREADS)))
  } catch {
    // localStorage full or unavailable
  }
}

export function useThreadHistory(initialThreadId?: string) {
  const [threads, setThreads] = useState<ThreadEntry[]>(loadThreads)
  const [activeThreadId, setActiveThreadId] = useState(
    () => initialThreadId ?? threads[0]?.id ?? `thread-${crypto.randomUUID()}`
  )

  const createThread = useCallback(() => {
    const newId = `thread-${crypto.randomUUID()}`
    const entry: ThreadEntry = {
      id: newId,
      title: 'Nova conversa',
      createdAt: new Date().toISOString(),
    }
    setThreads((prev) => {
      const updated = [entry, ...prev]
      saveThreads(updated)
      return updated
    })
    setActiveThreadId(newId)
    return newId
  }, [])

  const switchThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId)
  }, [])

  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads((prev) => {
      const updated = prev.map((t) => (t.id === threadId ? { ...t, title } : t))
      saveThreads(updated)
      return updated
    })
  }, [])

  const deleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => {
        const updated = prev.filter((t) => t.id !== threadId)
        saveThreads(updated)
        return updated
      })
      if (activeThreadId === threadId) {
        createThread()
      }
    },
    [activeThreadId, createThread]
  )

  // Ensure active thread is tracked
  const ensureTracked = useCallback(
    (firstMessage?: string) => {
      setThreads((prev) => {
        if (prev.some((t) => t.id === activeThreadId)) {
          // Update title from first message if still "Nova conversa"
          if (firstMessage) {
            const updated = prev.map((t) =>
              t.id === activeThreadId && t.title === 'Nova conversa'
                ? { ...t, title: firstMessage.slice(0, 50) }
                : t
            )
            saveThreads(updated)
            return updated
          }
          return prev
        }
        const entry: ThreadEntry = {
          id: activeThreadId,
          title: firstMessage?.slice(0, 50) ?? 'Nova conversa',
          createdAt: new Date().toISOString(),
        }
        const updated = [entry, ...prev]
        saveThreads(updated)
        return updated
      })
    },
    [activeThreadId]
  )

  return {
    threads,
    activeThreadId,
    createThread,
    switchThread,
    updateThreadTitle,
    deleteThread,
    ensureTracked,
  }
}
