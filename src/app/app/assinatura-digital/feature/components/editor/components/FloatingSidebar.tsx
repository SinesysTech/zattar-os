'use client';

import { useState, memo } from 'react';
import {
  PenTool,
  BadgeIcon,
  Calendar,
  Type,
  Plus,
  Lightbulb,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-viewport';
import type { EditorField, Signatario, SignatureFieldType } from '../types';
import SignerCard from './SignerCard';
import SignerDialog from './SignerDialog';

interface FloatingSidebarProps {
  signers: Signatario[];
  activeSigner: Signatario | null;
  onSelectSigner: (signer: Signatario | null) => void;
  onAddSigner: (nome: string, email: string) => void;
  onUpdateSigner: (id: string, updates: { nome?: string; email?: string }) => void;
  onDeleteSigner: (id: string) => void;
  currentUserEmail?: string;
  fields: EditorField[];
  onPaletteDragStart: (fieldType: SignatureFieldType) => void;
  onPaletteDragEnd: () => void;
  onReviewAndSend?: () => void;
}

interface FieldPaletteItem {
  type: SignatureFieldType;
  label: string;
  icon: React.ReactNode;
}

const FIELD_PALETTE: FieldPaletteItem[] = [
  { type: 'signature', label: 'Assinatura', icon: <PenTool className="size-5" /> },
  { type: 'initials', label: 'Iniciais', icon: <BadgeIcon className="size-5" /> },
  { type: 'date', label: 'Data', icon: <Calendar className="size-5" /> },
  { type: 'textbox', label: 'Texto', icon: <Type className="size-5" /> },
];

/**
 * FieldPaletteCard - Draggable field card in the palette
 */
const FieldPaletteCard = memo(function FieldPaletteCard({
  item,
  onDragStart,
  onDragEnd,
}: {
  item: FieldPaletteItem;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDragStart();
      // Simulate drag end after a short delay for keyboard users
      setTimeout(onDragEnd, 100);
    }
  };

  return (
    <div
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('fieldType', item.type);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl',
        'bg-muted/50 border border-transparent',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'hover:bg-primary/10 hover:border-primary/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
      role="button"
      tabIndex={0}
      aria-label={`Arrastar campo ${item.label}`}
    >
      <div className="text-muted-foreground">{item.icon}</div>
      <span className="text-sm font-medium">{item.label}</span>
    </div>
  );
});

/**
 * SidebarContent - Main content of the sidebar
 */
function SidebarContent({
  signers,
  activeSigner,
  onSelectSigner,
  onAddSigner,
  onUpdateSigner,
  onDeleteSigner,
  currentUserEmail,
  fields,
  onPaletteDragStart,
  onPaletteDragEnd,
  onReviewAndSend,
}: FloatingSidebarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSigner, setEditingSigner] = useState<Signatario | null>(null);
  const [showOnlyActiveSigner, setShowOnlyActiveSigner] = useState(false);

  // Filter fields by active signer if toggle is on
  const filteredFields = showOnlyActiveSigner && activeSigner
    ? fields.filter((f) => f.signatario_id === activeSigner.id)
    : fields;

  const handleSaveSigner = (nome: string, email: string) => {
    if (editingSigner) {
      onUpdateSigner(editingSigner.id, { nome, email });
    } else {
      onAddSigner(nome, email);
    }
    setEditingSigner(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b space-y-1">
        <h2 className="text-lg font-bold">Configurar Documento</h2>
        <p className="text-sm text-muted-foreground">
          Adicione signatários e arraste os campos para o documento.
        </p>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Section 1: Who is signing? */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quem vai assinar?</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="size-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {signers.map((signer) => (
                <SignerCard
                  key={signer.id}
                  signer={signer}
                  isActive={activeSigner?.id === signer.id}
                  isCurrentUser={signer.email === currentUserEmail}
                  onSelect={() => onSelectSigner(signer)}
                  onEdit={() => setEditingSigner(signer)}
                  onDelete={() => onDeleteSigner(signer.id)}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Drag & Drop Fields */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Arrastar Campos</h3>
              {activeSigner && (
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: activeSigner.cor }}
                  title={`Cor do signatário: ${activeSigner.nome}`}
                />
              )}
            </div>

            {/* Filter toggle */}
            {activeSigner && (
              <div className="flex items-center gap-2">
                <Switch
                  id="filter-signer"
                  checked={showOnlyActiveSigner}
                  onCheckedChange={setShowOnlyActiveSigner}
                />
                <Label htmlFor="filter-signer" className="text-xs text-muted-foreground cursor-pointer">
                  Mostrar apenas campos de {activeSigner.nome}
                </Label>
              </div>
            )}

            {/* Field palette grid */}
            <div className="grid grid-cols-2 gap-2">
              {FIELD_PALETTE.map((item) => (
                <FieldPaletteCard
                  key={item.type}
                  item={item}
                  onDragStart={() => onPaletteDragStart(item.type)}
                  onDragEnd={onPaletteDragEnd}
                />
              ))}
            </div>

            {/* Field count */}
            <p className="text-xs text-muted-foreground text-center">
              {filteredFields.length} campo{filteredFields.length !== 1 ? 's' : ''} no documento
            </p>
          </section>

          {/* Pro Tip Section */}
          <section className="bg-orange-50/30 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-4">
            <div className="flex gap-3">
              <Lightbulb className="size-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Dica
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  Segure <kbd className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 rounded text-[10px] font-mono">Shift</kbd> para selecionar múltiplos campos.
                  Use o botão direito para mais opções.
                </p>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 border-t bg-muted/30">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onReviewAndSend}
          disabled={fields.length === 0}
        >
          Revisar e Enviar
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Add/Edit Signer Dialog */}
      <SignerDialog
        open={showAddDialog || !!editingSigner}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingSigner(null);
          }
        }}
        signer={editingSigner || undefined}
        onSave={handleSaveSigner}
        mode={editingSigner ? 'edit' : 'add'}
      />
    </div>
  );
}

/**
 * FloatingSidebar - Responsive sidebar for signer management and field palette
 * Desktop: Fixed sidebar on the right
 * Mobile: Sheet (drawer) triggered by FAB
 */
export default function FloatingSidebar(props: FloatingSidebarProps) {
  const { isMobile } = useViewport();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Floating Action Button for mobile */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className={cn(
                'fixed bottom-6 right-6 z-50',
                'size-14 rounded-full shadow-xl',
                'bg-primary hover:bg-primary/90',
                'hover:scale-110 active:scale-95 transition-transform duration-200'
              )}
              aria-label="Abrir configurações do documento"
            >
              <Settings className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div
      className={cn(
        'fixed right-0 top-0 z-40',
        'w-100 h-screen',
        'bg-background border-l shadow-lg',
        'flex flex-col'
      )}
    >
      <SidebarContent {...props} />
    </div>
  );
}
