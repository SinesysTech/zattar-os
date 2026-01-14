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

// ... (existing code for FieldPaletteCard and SidebarContent)

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
  return (
    <div
      className={cn(
        'fixed right-0 top-0 z-40',
        'w-96 h-screen', // Changed w-100 to w-96 (24rem)
        'bg-background border-l shadow-lg',
        'flex flex-col',
        props.className
      )}
    >
      <SidebarContent {...props} />
    </div>
  );
}
