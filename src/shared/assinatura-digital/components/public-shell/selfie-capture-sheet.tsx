'use client'

import * as React from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { cn } from '@/lib/utils'

interface SelfieCaptureSheetProps {
  open: boolean
  onSkip: () => void
  onCapture: (base64: string) => void
  title?: string
  description?: string
}

/**
 * Sub-tela modal transparente sobre o step "Assinar".
 *
 * Abre câmera via navigator.mediaDevices.getUserMedia. Se o acesso falhar
 * (negado ou indisponível), mostra mensagem e permite pular. Ao capturar,
 * desenha o frame atual do vídeo em canvas temporário e emite base64 JPEG.
 */
export function SelfieCaptureSheet({
  open,
  onSkip,
  onCapture,
  title = 'Verificação por foto',
  description = 'Posicione seu rosto no centro e tire uma selfie para confirmar sua identidade.',
}: SelfieCaptureSheetProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    let active = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        setStream(s)
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => {
        if (active) setError('Não foi possível acessar a câmera.')
      })
    return () => {
      active = false
      setStream((current) => {
        current?.getTracks().forEach((t) => t.stop())
        return null
      })
    }
  }, [open])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) {
      onCapture('')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      onCapture('')
      return
    }
    ctx.drawImage(video, 0, 0)
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="selfie-sheet-title"
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-md sm:items-center',
        'animate-in fade-in duration-200',
      )}
    >
      <GlassPanel
        depth={1}
        className="flex w-full max-w-lg flex-col gap-4 rounded-t-2xl border-t border-outline-variant/30 p-6 sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Heading level="section" id="selfie-sheet-title" className="text-xl">
              {title}
            </Heading>
            <Text variant="caption" className="text-muted-foreground">
              {description}
            </Text>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative aspect-3/4 overflow-hidden rounded-xl border border-outline-variant/30 bg-muted">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <Text variant="caption" className="text-muted-foreground">
                {error}
              </Text>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="h-11 cursor-pointer"
          >
            Pular
          </Button>
          <Button
            type="button"
            onClick={handleCapture}
            disabled={!stream && !error}
            className="h-11 cursor-pointer"
          >
            <Camera className="mr-2 h-4 w-4" />
            Capturar
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
