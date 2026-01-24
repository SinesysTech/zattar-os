'use client';

import { useState } from 'react';
import {
  PenTool,
  BadgeIcon,
  Plus,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-viewport';
import type { EditorField, Signatario, SignatureFieldType } from '../types';
import SignerCard from './SignerCard';
import SignerDialog from './SignerDialog';
import { SectionHeader } from './SectionHeader';
import { ProTip, ProTipLabel, Kbd } from './ProTip';

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
  className?: string;
}

// --- FIELD PALETTE CARD ---

interface FieldPaletteCardProps {
  type: SignatureFieldType;
  icon: React.ElementType;
  label: string;
  onDragStart: (type: SignatureFieldType) => void;
  onDragEnd: () => void;
}

function FieldPaletteCard({
  type,
  icon: Icon,
  label,
  onDragStart,
  onDragEnd
}: FieldPaletteCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(type);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'flex items-center gap-2 p-3 border rounded-lg',
        'cursor-grab active:cursor-grabbing select-none',
        'bg-background hover:bg-muted/30 hover:border-muted-foreground/30',
        'transition-colors'
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// --- SIDEBAR CONTENT ---

function SidebarContent(props: FloatingSidebarProps) {
  const {
    signers,
    activeSigner,
    onSelectSigner,
    onAddSigner,
    onUpdateSigner,
    onDeleteSigner,
    onPaletteDragStart,
    onPaletteDragEnd,
    onReviewAndSend
  } = props;

  const [isAddSignerOpen, setIsAddSignerOpen] = useState(false);

  const FIELD_TYPES = [
    { type: 'signature' as const, label: 'Assinatura', icon: PenTool },
    { type: 'initials' as const, label: 'Rubrica', icon: BadgeIcon },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold">Configuração</h2>
        <p className="text-sm text-muted-foreground">
          Configure assinantes e campos
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Signers Section */}
          <div className="space-y-3">
            <SectionHeader
              title="Quem vai assinar?"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-primary hover:text-primary/80"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5 mr-1" />
                  Adicionar
                </Button>
              }
            />

            {/* Signers List */}
            <div className="space-y-2">
              {signers.length === 0 ? (
                <div className="text-center py-6 px-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Nenhum assinante adicionado.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setIsAddSignerOpen(true)}
                  >
                    Adicionar agora
                  </Button>
                </div>
              ) : (
                signers.map(signer => (
                  <SignerCard
                    key={signer.id}
                    signer={signer}
                    isActive={activeSigner?.id === signer.id}
                    onSelect={() => onSelectSigner(signer)}
                    onDelete={() => onDeleteSigner(signer.id)}
                    onEdit={() => onUpdateSigner(signer.id, {})}
                    isCurrentUser={false}
                  />
                ))
              )}
            </div>
          </div>

          {/* Separator */}
          <Separator className="my-6" />

          {/* Fields Section */}
          <div className="space-y-3">
            <SectionHeader title="Arraste os campos" />

            {/* Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {FIELD_TYPES.map(ft => (
                <FieldPaletteCard
                  key={ft.type}
                  type={ft.type}
                  label={ft.label}
                  icon={ft.icon}
                  onDragStart={onPaletteDragStart}
                  onDragEnd={onPaletteDragEnd}
                />
              ))}
            </div>
          </div>

        {/* ProTip */}
        <div className="mt-6">
          <ProTip>
            <ProTipLabel>Dica:</ProTipLabel> Segure{' '}
            <Kbd>Shift</Kbd> para selecionar múltiplos campos e alinhá-los.
          </ProTip>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t">
        <Button
          className="w-full h-12 text-base"
          onClick={onReviewAndSend}
          disabled={!onReviewAndSend}
        >
          Revisar e Enviar
          <ArrowRight className="ml-2 size-5" />
        </Button>
      </div>

      <SignerDialog
        open={isAddSignerOpen}
        onOpenChange={setIsAddSignerOpen}
        onSave={onAddSigner}
        mode="add"
      />
    </div>
  );
}

/**
 * FloatingSidebar - Responsive sidebar for signer management and field palette
 *
 * Layout based on design system:
 * - Header: "Configuração" with subtitle
 * - Section "QUEM VAI ASSINAR?" with signers list
 * - Section "ARRASTE OS CAMPOS" with 2x2 grid
 * - ProTip with highlight color
 * - Footer with primary CTA
 *
 * Desktop: Renders inside a card container provided by parent
 * Mobile: Sheet (drawer) triggered by FAB
 */
export default function FloatingSidebar(props: FloatingSidebarProps) {
  const { isMobile } = useViewport();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isMobile) {
    return (
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
        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-xl">
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Content rendered inside card container from parent
  return (
    <div className={cn('flex flex-col h-full', props.className)}>
      <SidebarContent {...props} />
    </div>
  );
}
