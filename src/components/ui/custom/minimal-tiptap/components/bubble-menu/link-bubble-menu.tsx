import * as React from 'react'
import type { ShouldShowProps } from '../../types'
import type { Editor } from '@tiptap/react'
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import { PluginKey } from '@tiptap/pm/state'
import { LinkPopoverBlock } from '../link/link-popover-block'

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';

interface LinkBubbleMenuProps {
  editor: Editor
}

interface LinkAttributes {
  href: string
  target: string
}

/**
 * TipTap v3 não exporta mais o componente React `BubbleMenu` em `@tiptap/react`.
 * Aqui fazemos um wrapper mínimo usando `BubbleMenuPlugin` (extension-bubble-menu)
 * e registrando o plugin dinamicamente no editor.
 */
const BubbleMenu = ({
  editor,
  shouldShow,
  tippyOptions,
  children,
}: {
  editor: Editor
  shouldShow?: (props: ShouldShowProps) => boolean
  tippyOptions?: { placement?: Placement; onHidden?: () => void }
  children: React.ReactNode
}) => {
  const elementRef = React.useRef<HTMLDivElement | null>(null)
  const pluginKeyRef = React.useRef<PluginKey>(new PluginKey('linkBubbleMenu'))

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return
    if (!editor || editor.isDestroyed) return

    const pluginKey = pluginKeyRef.current
    const plugin = BubbleMenuPlugin({
      pluginKey,
      editor,
      element,
      shouldShow: (props) => {
        if (!shouldShow) return true
        return shouldShow({
          editor: props.editor,
          view: props.view,
          state: props.state,
          oldState: props.oldState,
          from: props.from,
          to: props.to
        })
      },
      options: {
        placement: tippyOptions?.placement ?? 'bottom-start',
        onHide: () => {
          tippyOptions?.onHidden?.()
        },
      },
    })

    editor.registerPlugin(plugin)

    return () => {
      editor.unregisterPlugin(pluginKey)
    }
  }, [editor, shouldShow, tippyOptions])

  return <div ref={elementRef}>{children}</div>
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
  const [linkAttrs, setLinkAttrs] = React.useState<LinkAttributes>({ href: '', target: '' })
  const [selectedText, setSelectedText] = React.useState('')

  const updateLinkState = React.useCallback(() => {
    const { from, to } = editor.state.selection
    const { href, target } = editor.getAttributes('link')
    const text = editor.state.doc.textBetween(from, to, ' ')

    setLinkAttrs({ href, target })
    setSelectedText(text)
  }, [editor])

  const shouldShow = React.useCallback(
    ({ editor, from, to }: ShouldShowProps) => {
      if (from === to) {
        return false
      }
      const { href } = editor.getAttributes('link')

      if (!editor.isActive('link') || !editor.isEditable) {
        return false
      }

      if (href) {
        updateLinkState()
        return true
      }
      return false
    },
    [updateLinkState]
  )

  const onSetLink = React.useCallback(
    (url: string, text?: string, openInNewTab?: boolean) => {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .insertContent({
          type: 'text',
          text: text || url,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
                target: openInNewTab ? '_blank' : ''
              }
            }
          ]
        })
        .setLink({ href: url, target: openInNewTab ? '_blank' : '' })
        .run()
      updateLinkState()
    },
    [editor, updateLinkState]
  )

  const onUnsetLink = React.useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    updateLinkState()
  }, [editor, updateLinkState])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      tippyOptions={{
        placement: 'bottom-start',
        onHidden: () => undefined
      }}
    >
      <LinkPopoverBlock
        url={linkAttrs.href}
        defaultText={selectedText}
        defaultIsNewTab={linkAttrs.target === '_blank'}
        onSave={onSetLink}
        onClear={onUnsetLink}
      />
    </BubbleMenu>
  )
}
