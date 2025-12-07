'use client';

import { useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  endpoint: string;
  filtros?: Record<string, string | number | boolean>;
  opcoes: Array<{ label: string; formato: 'pdf' | 'csv' | 'excel' }>;
  disabled?: boolean;
}

export function ExportButton({ endpoint, filtros, opcoes, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filtros || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, String(value));
    });
    return params.toString();
  }, [filtros]);

  const handleExport = async (formato: 'pdf' | 'csv' | 'excel') => {
    try {
      setLoading(formato);
      const url = `${endpoint}?${queryString ? `${queryString}&` : ''}formato=${formato}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const nameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/);
      const fileName = nameMatch ? nameMatch[1] : `export.${formato === 'excel' ? 'csv' : formato}`;
      saveAs(blob, fileName);
      toast.success('Exportação iniciada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao exportar');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled || !!loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {opcoes.map((opcao) => (
          <DropdownMenuItem key={opcao.formato} onClick={() => handleExport(opcao.formato)}>
            {opcao.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
