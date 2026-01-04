import * as React from 'react'
import { Separator } from '@/components/ui/separator'
import { ToolbarButton } from '../toolbar-button'
import { CopyIcon, ExternalLinkIcon, LinkBreak2Icon } from '@radix-ui/react-icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LinkEditBlock } from './link-edit-block'

interface LinkPopoverBlockProps {
  url: string
  onClear: () => void
  defaultText?: string
  defaultIsNewTab?: boolean
  onSave: (url: string, text?: string, isNewTab?: boolean) => void
}

export const LinkPopoverBlock: React.FC<LinkPopoverBlockProps> = ({
  url,
  onClear,
  defaultText,
  defaultIsNewTab,
  onSave,
}) => {
  const [copyTitle, setCopyTitle] = React.useState<string>('Copiar')
  const [open, setOpen] = React.useState(false)

  const handleCopy = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopyTitle('Copiado!')
          setTimeout(() => setCopyTitle('Copiar'), 1000)
        })
        .catch(console.error)
    },
    [url]
  )

  const handleOpenLink = React.useCallback(() => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [url])

  return (
    <div className="flex h-10 overflow-hidden rounded bg-background p-2 shadow-lg">
      <div className="inline-flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <ToolbarButton tooltip="Editar link" className="w-auto px-2">
              Editar link
            </ToolbarButton>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-full min-w-80 p-0" side="bottom">
            <LinkEditBlock
              defaultUrl={url}
              defaultText={defaultText}
              defaultIsNewTab={defaultIsNewTab}
              onSave={(newUrl, text, isNewTab) => {
                onSave(newUrl, text, isNewTab)
                setOpen(false)
              }}
              className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden"
            />
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" />
        <ToolbarButton tooltip="Abrir link em uma nova aba" onClick={handleOpenLink}>
          <ExternalLinkIcon className="size-4" />
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton tooltip="Remover link" onClick={onClear}>
          <LinkBreak2Icon className="size-4" />
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton
          tooltip={copyTitle}
          onClick={handleCopy}
          tooltipOptions={{
            onPointerDownOutside: e => {
              if (e.target === e.currentTarget) e.preventDefault()
            }
          }}
        >
          <CopyIcon className="size-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}
