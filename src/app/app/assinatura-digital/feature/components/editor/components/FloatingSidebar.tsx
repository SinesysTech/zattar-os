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
        'flex flex-col items-center justify-center gap-3 p-4 border rounded-xl',
        'cursor-grab active:cursor-grabbing select-none',
        'bg-background hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm',
        'transition-all duration-200 group'
      )}
    >
      <div className="p-2.5 rounded-full bg-muted group-hover:bg-background group-hover:text-primary transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
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
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-zinc-900/50">
      {/* Header */}
      <div className="px-6 py-5 bg-background border-b shadow-sm">
        <h2 className="text-lg font-bold tracking-tight">Configuração</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Prepare o documento para assinatura
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Signers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Quem vai assinar?" />
          </div>

          {/* Signers List */}
          <div className="space-y-3">
            {signers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-background/50 hover:bg-background transition-colors text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Nenhum assinante
                </p>
                <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">
                  Adicione as pessoas que precisam assinar este documento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5 mr-2" />
                  Adicionar Assinante
                </Button>
              </div>
            ) : (
              <>
                {signers.map(signer => (
                  <SignerCard
                    key={signer.id}
                    signer={signer}
                    isActive={activeSigner?.id === signer.id}
                    onSelect={() => onSelectSigner(signer)}
                    onDelete={() => onDeleteSigner(signer.id)}
                    onEdit={() => onUpdateSigner(signer.id, {})}
                    isCurrentUser={false}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => setIsAddSignerOpen(true)}
                >
                  <Plus className="size-3.5 mr-2" />
                  Adicionar Outro
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Fields Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <SectionHeader title="Campos de Assinatura" />
            <p className="text-xs text-muted-foreground">
              Arraste os campos para o documento e solte onde deseja que o assinante assine.
            </p>
          </div>

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
        <div className="pt-2">
          <ProTip className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
            <ProTipLabel><span className="text-blue-600 dark:text-blue-400">Dica Pro:</span></ProTipLabel> Segure{' '}
            <Kbd>Shift</Kbd> ao clicar para selecionar múltiplos campos e alinhá-los automaticamente.
          </ProTip>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-background border-t shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-10">
        <Button
          className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
          onClick={onReviewAndSend}
          disabled={!onReviewAndSend}
        >
          Salvar e Continuar
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
