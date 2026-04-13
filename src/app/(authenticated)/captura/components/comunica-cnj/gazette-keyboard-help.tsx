'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SHORTCUTS = [
  { key: '/', desc: 'Focar busca' },
  { key: '⌘K', desc: 'Busca NLP' },
  { key: '↑ ↓', desc: 'Navegar entre itens' },
  { key: 'Enter', desc: 'Abrir painel de detalhes' },
  { key: 'Esc', desc: 'Fechar painel / dialog' },
  { key: 't', desc: 'Alternar tabela / cards' },
  { key: 'v', desc: 'Vincular (no painel de órfão)' },
  { key: 'p', desc: 'Ver PDF' },
  { key: '?', desc: 'Mostrar atalhos' },
];

export function GazetteKeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setOpen(prev => !prev);
    }
    document.addEventListener('gazette:toggle-keyboard-help', handleToggle);
    return () => document.removeEventListener('gazette:toggle-keyboard-help', handleToggle);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-dialog max-w-sm">
        <DialogHeader>
          <DialogTitle>Atalhos de Teclado</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 py-2">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="contents">
              <kbd className="px-2 py-0.5 bg-muted/30 border border-border/30 rounded text-xs font-mono text-muted-foreground text-center min-w-[36px]">
                {key}
              </kbd>
              <span className="text-sm text-muted-foreground/70">{desc}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
