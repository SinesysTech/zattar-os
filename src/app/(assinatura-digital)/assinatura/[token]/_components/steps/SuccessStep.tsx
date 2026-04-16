'use client'

import * as React from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { SuccessHero } from '@/shared/assinatura-digital'

export interface SuccessStepProps {
  documento: { titulo?: string | null; pdf_final_url?: string | null }
  onReturnToDashboard?: () => void
}

export function SuccessStep({ documento, onReturnToDashboard }: SuccessStepProps) {
  const fileName = documento.titulo ?? 'Documento.pdf'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 items-start overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-lg">
          <SuccessHero
            title="Tudo pronto!"
            subtitle="Seu documento foi assinado com sucesso."
          >
            {documento.pdf_final_url && (
              <GlassPanel depth={1} className="mt-6 space-y-3 rounded-2xl p-5">
                <Text variant="overline" className="block text-muted-foreground">
                  Documento assinado
                </Text>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold text-primary">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <Text variant="label" className="block truncate text-foreground">
                      {fileName}
                    </Text>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    asChild
                    className="cursor-pointer text-primary hover:bg-primary/10"
                  >
                    <a
                      href={documento.pdf_final_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Baixar
                    </a>
                  </Button>
                </div>
              </GlassPanel>
            )}

            <GlassPanel depth={1} className="mt-3 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <Text variant="micro-caption" className="text-left text-muted-foreground">
                  Uma cópia será enviada por email. Guarde-a para futura referência.
                </Text>
              </div>
            </GlassPanel>

            {onReturnToDashboard && (
              <Button
                type="button"
                variant="outline"
                onClick={onReturnToDashboard}
                className="mt-6 h-11 w-full cursor-pointer"
              >
                Voltar ao início
              </Button>
            )}
          </SuccessHero>
        </div>
      </div>
    </div>
  )
}
