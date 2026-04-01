'use client'

import { useCallback, useState } from 'react'
import {
  type AttachmentType,
  type PedrinhoAttachment,
  ACCEPTED_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  getAttachmentType,
} from '../types'

interface UseAttachmentsReturn {
  attachments: PedrinhoAttachment[]
  error: string | null
  addFiles: (files: FileList | File[]) => Promise<void>
  addAudioBlob: (blob: Blob, duration: number) => void
  remove: (id: string) => void
  clear: () => void
  openFilePicker: (type: AttachmentType) => void
  toBase64Array: () => Promise<Array<{ data: string; mediaType: string; name: string }>>
}

function generateId(): string {
  return crypto.randomUUID()
}

async function fileToPreview(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(file)
  })
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useAttachments(): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<PedrinhoAttachment[]>([])
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" excede o limite de 15MB`)
        continue
      }

      setAttachments((prev) => {
        if (prev.length >= MAX_ATTACHMENTS) {
          setError(`Máximo de ${MAX_ATTACHMENTS} anexos por mensagem`)
          return prev
        }
        const type = getAttachmentType(file.type)
        const attachment: PedrinhoAttachment = {
          id: generateId(),
          file,
          type,
          mediaType: file.type,
          name: file.name,
          size: file.size,
        }
        if (type === 'image') {
          fileToPreview(file).then((preview) => {
            setAttachments((current) =>
              current.map((a) => (a.id === attachment.id ? { ...a, preview } : a))
            )
          })
        }
        return [...prev, attachment]
      })
    }
  }, [])

  const addAudioBlob = useCallback((blob: Blob, duration: number) => {
    setError(null)
    if (blob.size > MAX_FILE_SIZE) {
      setError('Gravação excede o limite de 15MB')
      return
    }
    setAttachments((prev) => {
      if (prev.length >= MAX_ATTACHMENTS) {
        setError(`Máximo de ${MAX_ATTACHMENTS} anexos por mensagem`)
        return prev
      }
      const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
      return [
        ...prev,
        {
          id: generateId(),
          file,
          type: 'audio' as const,
          mediaType: file.type,
          name: file.name,
          size: file.size,
          duration,
        },
      ]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    setError(null)
  }, [])

  const clear = useCallback(() => {
    setAttachments([])
    setError(null)
  }, [])

  const openFilePicker = useCallback(
    (type: AttachmentType) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = ACCEPTED_TYPES[type]
      input.multiple = true
      input.onchange = () => {
        if (input.files?.length) {
          addFiles(input.files)
        }
      }
      input.click()
    },
    [addFiles]
  )

  const toBase64Array = useCallback(async () => {
    return Promise.all(
      attachments.map(async (a) => ({
        data: await fileToBase64(a.file),
        mediaType: a.mediaType,
        name: a.name,
      }))
    )
  }, [attachments])

  return { attachments, error, addFiles, addAudioBlob, remove, clear, openFilePicker, toBase64Array }
}
