import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Variable } from './extensions/Variable';
import {
  getAvailableVariables,
  type VariableOption,
  markdownToTiptapJSON,
  tiptapJSONToMarkdown,
} from '@/lib/formsign';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Variable as VariableIcon,
} from 'lucide-react';

interface MarkdownRichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  formularios: string[];
}

export function MarkdownRichTextEditor({ value, onChange, formularios }: MarkdownRichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [variableSearch, setVariableSearch] = useState('');
  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Digite seu texto aqui...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Variable,
    ],
    content: markdownToTiptapJSON(value),
    onUpdate: ({ editor }) => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      const markdown = tiptapJSONToMarkdown(editor.getJSON() as any);
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && !isInternalUpdate.current) {
      const currentMarkdown = tiptapJSONToMarkdown(editor.getJSON() as any);
      if (currentMarkdown !== value) {
        isInternalUpdate.current = true;
        editor.commands.setContent(markdownToTiptapJSON(value));
      }
    }
  }, [value, editor]);

  const variables = getAvailableVariables(formularios);

  const insertVariable = (variable: VariableOption) => {
    editor?.chain().focus().insertVariable({ key: variable.value }).run();
  };

  const openLinkDialog = () => {
    const { from, to } = editor?.state.selection || {};
    const selectedText = editor?.state.doc.textBetween(from, to);
    setLinkText(selectedText || '');
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      editor?.chain().focus().setLink({ href: linkUrl }).insertContent(linkText).run();
    }
    setLinkDialogOpen(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openLinkDialog}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Combobox
          items={variables.map(v => ({ value: v.value, label: `${v.category}: ${v.label}` }))}
          value=""
          onValueChange={(value) => {
            const variable = variables.find(v => v.value === value);
            if (variable) insertVariable(variable);
          }}
          placeholder="Inserir variável..."
          searchPlaceholder="Buscar variável..."
          emptyMessage="Nenhuma variável encontrada"
          className="w-48"
        >
          <Button variant="ghost" size="sm">
            <VariableIcon className="h-4 w-4 mr-2" />
            Variável
          </Button>
        </Combobox>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 max-h-[calc(85vh-250px)] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-text">Texto do Link</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Texto do link"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            <Button onClick={insertLink} className="w-full">
              Inserir Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}