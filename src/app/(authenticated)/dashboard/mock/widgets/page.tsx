/**
 * WIDGET GALLERY — Galeria de Widgets por Módulo
 * ============================================================================
 * Acesse em: /app/dashboard/mock/widgets
 * Cada seção corresponde a um módulo do Zattar OS.
 * Widgets usam dados fictícios para visualização de layout.
 * ============================================================================
 */

'use client';

import { cn } from '@/lib/utils';
import { ProcessosWidgets } from './section-processos';
import { AudienciasWidgets } from './section-audiencias';
import { ExpedientesWidgets } from './section-expedientes';
import { FinanceiroWidgets } from './section-financeiro';
import { ContratosObrigacoesWidgets } from './section-contratos';
import { PessoalWidgets } from './section-pessoal';

export default function WidgetGalleryPage() {
  return (
    <div className={cn(/* design-system-escape: space-y-12 sem token DS; pb-12 padding direcional sem Inset equiv. */ "space-y-12 pb-12")}>
      {/* Header */}
      <div>
        <h1 className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-2xl font-heading font-bold tracking-tight")}>
          Widget Gallery
        </h1>
        <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground/60 mt-1")}>
          Biblioteca de widgets organizados por módulo. Dados fictícios para visualização de layout.
        </p>
      </div>

      {/* Module Sections */}
      <ProcessosWidgets />
      <AudienciasWidgets />
      <ExpedientesWidgets />
      <FinanceiroWidgets />
      <ContratosObrigacoesWidgets />
      <PessoalWidgets />
    </div>
  );
}
