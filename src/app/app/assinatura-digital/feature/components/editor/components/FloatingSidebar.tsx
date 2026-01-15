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
        e.dataTransfer.setData('field-type', type);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(type);
      }}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing select-none"
    >
      <div className="p-2 rounded-md" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <UsersIcon className="size-4 text-primary" />
            Assinantes
          </h2>
          <p className="text-xs text-muted-foreground">{signers.length} adicionado(s)</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAddSignerOpen(true)} className="h-8 gap-1.5">
          <Plus className="size-3.5" />
          Novo
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Signers List */}
          <div className="space-y-2">
            {signers.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Nenhum assinante adicionado.</p>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setIsAddSignerOpen(true)}>
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

          {/* Separator */}
          <div className="border-t" />

          {/* Palette */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground">Campos Disponíveis</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Para adicionar, arraste um campo para o local desejado no documento.
            </p>

            <div className="space-y-2">
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t shrink-0">
        <Button
          className="w-full"
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
        !hasCustomLayout && 'fixed right-0 top-0 z-40 w-96 h-screen shadow-lg border-l',
        'bg-background',
        'flex flex-col',
        props.className
      )}
    >
      <SidebarContent {...props} />
    </div>
  );
}
