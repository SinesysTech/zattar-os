'use client'

import { useState } from 'react'
import { Download, FileText, PackageOpen} from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'

import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/typography'
import { GlassPanel } from '@/components/shared/glass-panel'
import { useFormularioStore } from '@/shared/assinatura-digital/store'
import type { PdfGerado } from '@/shared/assinatura-digital/types/store'
import { SuccessHero } from '@/shared/assinatura-digital'

import { LoadingSpinner } from "@/components/ui/loading-state"
export default function Sucesso() {
  const resetAll = useFormularioStore((state) => state.resetAll)
  const getCachedTemplate = useFormularioStore((state) => state.getCachedTemplate)
  const dadosPessoais = useFormularioStore((state) => state.dadosPessoais)
  const pdfsGerados = useFormularioStore((state) => state.pdfsGerados)

  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const getTemplateName = (templateId: string): string => {
    const template = getCachedTemplate(templateId)
    return template?.nome || 'Documento'
  }

  const handleDownloadIndividual = async (pdf: PdfGerado) => {
    if (!pdf.pdf_url) {
      toast.error('URL do documento não disponível')
      return
    }
    if (!pdf.pdf_url.startsWith('http://') && !pdf.pdf_url.startsWith('https://')) {
      toast.error('URL do documento inválida')
      return
    }

    const fileName = `${getTemplateName(pdf.template_id)}.pdf`
    const link = document.createElement('a')
    link.href = pdf.pdf_url
    link.download = fileName
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download iniciado!')
  }

  const handleDownloadTodosZip = async () => {
    if (!pdfsGerados || pdfsGerados.length === 0) {
      toast.error('Nenhum documento disponível para download')
      return
    }

    const pdfsValidos = pdfsGerados.filter(
      (pdf) =>
        pdf.pdf_url &&
        (pdf.pdf_url.startsWith('http://') || pdf.pdf_url.startsWith('https://')),
    )

    if (pdfsValidos.length === 0) {
      toast.error('Nenhum documento válido encontrado para download')
      return
    }

    setIsDownloadingZip(true)
    toast.loading('Preparando documentos...', { id: 'download-zip' })

    try {
      const zip = new JSZip()
      await Promise.all(
        pdfsValidos.map(async (pdf) => {
          const response = await fetch(pdf.pdf_url)
          if (!response.ok) throw new Error(`Falha ao baixar PDF: ${response.statusText}`)
          const blob = await response.blob()
          zip.file(`${getTemplateName(pdf.template_id)}.pdf`, blob)
        }),
      )
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `documentos-assinados-${timestamp}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success(`${pdfsValidos.length} documento(s) baixado(s) em ZIP!`, { id: 'download-zip' })
    } catch (error) {
      console.error('❌ Erro ao criar ZIP:', error)
      toast.error('Erro ao preparar documentos para download. Tente baixar individualmente.', {
        id: 'download-zip',
      })
    } finally {
      setIsDownloadingZip(false)
    }
  }

  const hasPdfs = pdfsGerados && pdfsGerados.length > 0
  const pdfsValidos = hasPdfs
    ? pdfsGerados.filter(
        (pdf) =>
          pdf.pdf_url &&
          (pdf.pdf_url.startsWith('http://') || pdf.pdf_url.startsWith('https://')),
      )
    : []

  const title = pdfsValidos.length > 1 ? 'Documentos assinados!' : 'Tudo pronto!'
  const subtitle =
    pdfsValidos.length > 1
      ? `${pdfsValidos.length} documentos foram assinados com sucesso.`
      : 'Seu documento foi assinado com sucesso.'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 items-start overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-lg">
          <SuccessHero title={title} subtitle={subtitle}>
            {pdfsValidos.length > 0 ? (
              <GlassPanel depth={1} className="mt-6 space-y-3 rounded-2xl p-4">
                {pdfsValidos.map((pdf) => (
                  <button
                    key={pdf.template_id}
                    type="button"
                    onClick={() => handleDownloadIndividual(pdf)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-3 text-left transition-colors hover:bg-surface-container-low/60 active:scale-[0.98]"
                  >
                    <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold text-primary">
                      PDF
                    </div>
                    <Text variant="label" className="min-w-0 flex-1 truncate text-foreground">
                      {getTemplateName(pdf.template_id)}
                    </Text>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}

                {pdfsValidos.length > 1 && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleDownloadTodosZip}
                    disabled={isDownloadingZip}
                    className="h-11 w-full cursor-pointer"
                  >
                    {isDownloadingZip ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Preparando ZIP...
                      </>
                    ) : (
                      <>
                        <PackageOpen className="mr-2 h-4 w-4" />
                        Baixar todos em ZIP
                      </>
                    )}
                  </Button>
                )}
              </GlassPanel>
            ) : (
              <Text variant="caption" className="mt-6 block text-destructive">
                Documentos não disponíveis para download. Entre em contato com o suporte.
              </Text>
            )}

            {dadosPessoais?.email && (
              <GlassPanel depth={1} className="mt-3 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <Text variant="micro-caption" className="text-left text-muted-foreground">
                    Uma cópia será enviada para {dadosPessoais.email}.
                  </Text>
                </div>
              </GlassPanel>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={resetAll}
              className="mt-6 h-11 w-full cursor-pointer"
            >
              Iniciar novo formulário
            </Button>
          </SuccessHero>
        </div>
      </div>
    </div>
  )
}
