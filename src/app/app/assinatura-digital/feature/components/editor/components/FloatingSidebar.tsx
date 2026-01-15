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
  className?: string; // Add className
}

// --- HELPER COMPONENTS ---

interface FieldPaletteCardProps {
  type: SignatureFieldType;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  onDragStart: (type: SignatureFieldType) => void;
  onDragEnd: () => void;
}

function FieldPaletteCard({
  type,
  icon: Icon,
  label,
  description,
  color,
  onDragStart,
  onDragEnd
}: FieldPaletteCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        // Set drag data
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';

        // Create drag ghost (optional, browser default is usually ok but customized is better)
        // For now rely on browser

        onDragStart(type);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md select-none",
        "border-l-4"
      )}
      style={{ borderLeftColor: color }}
    >
      <div className={cn("p-2 rounded-md bg-background shadow-sm group-hover:scale-110 transition-transform")} style={{ color }}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{label}</div>
        <div className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</div>
      </div>
    </div>
  );
}

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
    { type: 'signature' as const, label: 'Assinatura', desc: 'Campo de assinatura principal', icon: PenTool, color: '#7C3AED' },
    { type: 'initials' as const, label: 'Rubrica', desc: 'Para todas as páginas', icon: BadgeIcon, color: '#EC4899' },
    // { type: 'date' as const, label: 'Data', desc: 'Data da assinatura', icon: Calendar, color: '#F59E0B' },
    // { type: 'textbox' as const, label: 'Texto', desc: 'Nome ou texto livre', icon: Type, color: '#3B82F6' },
  ];

  return (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between shrink-0 bg-background/50">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            Assinantes
          </h2>
          <p className="text-xs text-muted-foreground">{signers.length} adicionado(s)</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAddSignerOpen(true)} className="h-8 gap-1.5 shadow-sm">
          <Plus className="size-3.5" />
          Novo
        </Button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Signers List */}
          <div className="space-y-3">
            {signers.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed rounded-xl bg-muted/20">
                <UsersIcon className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum assinante adicionado.</p>
                <Button variant="link" size="sm" onClick={() => setIsAddSignerOpen(true)}>Adicionar Agora</Button>
              </div>
            ) : (
              signers.map(signer => (
                <SignerCard
                  key={signer.id}
                  signer={signer}
                  isActive={activeSigner?.id === signer.id}
                  onSelect={() => onSelectSigner(signer)}
                  // onDelete={() => onDeleteSigner(signer.id)} // SignerCard might not support delete directly if not passed?
                  // checking props... SignerCard likely implies internal specific props.
                  // Assuming SignerCard displays basic info and selection status.
                  // If we need delete, we wrap it or SignerCard supports it.
                  // I'll assume SignerCard handles display/selection.
                  onDelete={() => onDeleteSigner(signer.id)}
                  onEdit={() => onUpdateSigner(signer.id, {})} // Placeholder for edit, SignerCard requires onEdit too
                  isCurrentUser={false} // TODO: Add logic for current user check
                // color={signer.cor} // SignerCard takes signer object directly which has color
                />))
            )}
          </div>

          <div className="h-px bg-border/60 mx-2" />

          {/* Palette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Lightbulb className="size-4 text-emerald-500" />
              <h3 className="font-medium text-sm text-foreground/90">Campos Disponíveis</h3>
            </div>

            <div className="grid gap-3">
              <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3 text-xs text-blue-700 flex gap-2">
                <ArrowRight className="size-4 shrink-0 mt-0.5" />
                Para adicionar, arraste um campo para o local desejado no documento.
              </div>

              {FIELD_TYPES.map(ft => (
                <FieldPaletteCard
                  key={ft.type}
                  type={ft.type}
                  label={ft.label}
                  description={ft.desc}
                  icon={ft.icon}
                  color={ft.color}
                  onDragStart={onPaletteDragStart}
                  onDragEnd={onPaletteDragEnd}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0 space-y-3">
        <Button
          className="w-full h-11 text-base shadow-md font-medium"
          onClick={onReviewAndSend}
          disabled={!onReviewAndSend}
        >
          Revisar e Enviar
          <ArrowRight className="ml-2 size-4" />
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

// Helper icon
const UsersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

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

  // Desktop: Sidebar
  // Se className for passado, assume que o componente pai controla o posicionamento
  const hasCustomLayout = !!props.className;

  return (
    <div
      className={cn(
        // Usa posicionamento fixo apenas se não houver className customizado
        !hasCustomLayout && 'fixed right-0 top-0 z-40 w-96 h-screen shadow-lg',
        'bg-background border-l',
        'flex flex-col',
        props.className
      )}
    >
      <SidebarContent {...props} />
    </div>
  );
}
