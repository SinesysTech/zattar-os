"use client";

import { cn } from '@/lib/utils';
import { useEffect, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital/types/types';
import { Text } from '@/components/ui/typography';

export interface SegmentoSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  showInactive?: boolean;
}

export function SegmentoSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecione um segmento",
  showInactive = false,
}: SegmentoSelectProps) {
  const [segmentos, setSegmentos] = useState<AssinaturaDigitalSegmento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSegmentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (!showInactive) {
        params.set('ativo', 'true');
      }
      const response = await fetch(`/api/assinatura-digital/segmentos?${params.toString()}`);
      const result = await response.json();
      if (result.success && result.data) {
        setSegmentos(result.data);
      } else {
        setError(result.error || "Erro ao carregar segmentos");
      }
    } catch {
      setError("Erro de conexão ao carregar segmentos");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchSegmentos();
  }, [fetchSegmentos]);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className={cn("text-body-sm text-destructive")}>
        {error}
        <button
          type="button"
          onClick={fetchSegmentos}
          className="ml-2 text-primary underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value !== null ? String(value) : ""}
      onValueChange={(val) => onChange(val ? Number(val) : null)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Segmentos</SelectLabel>
          {segmentos.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              Nenhum segmento disponível
            </SelectItem>
          ) : (
            segmentos.map((segmento) => (
              <SelectItem key={segmento.id} value={String(segmento.id)}>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                  <span>{segmento.nome}</span>
                  {!segmento.ativo && (
                    <Text variant="caption">(Inativo)</Text>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
