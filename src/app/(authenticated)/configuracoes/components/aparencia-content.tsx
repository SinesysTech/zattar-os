'use client';

import * as React from 'react';
import { WidgetContainer } from '@/components/shared/glass-panel';
import {
  PresetSelector,
  ColorModeSelector,
  ThemeScaleSelector,
  ThemeRadiusSelector,
  ContentLayoutSelector,
  ResetThemeButton,
} from '@/components/layout/header/theme-customizer';
import { RotateCcw } from 'lucide-react';

export function AparenciaContent() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <WidgetContainer title="Tema" subtitle="Esquema de cores da aplicação">
          <PresetSelector label="Tema" placeholder="Selecione um tema" />
        </WidgetContainer>

        <WidgetContainer title="Modo de Cor" subtitle="Alterne entre modo claro e escuro">
          <ColorModeSelector
            label="Modo de cor"
            lightLabel="Claro"
            darkLabel="Escuro"
          />
        </WidgetContainer>

        <WidgetContainer title="Escala" subtitle="Tamanho dos elementos da interface">
          <ThemeScaleSelector label="Escala" />
        </WidgetContainer>

        <WidgetContainer title="Arredondamento" subtitle="Raio das bordas dos componentes">
          <ThemeRadiusSelector label="Arredondamento" />
        </WidgetContainer>

        <WidgetContainer title="Layout do Conteúdo" subtitle="Largura da área de conteúdo" className="hidden lg:flex">
          <ContentLayoutSelector
            label="Layout do conteúdo"
            fullLabel="Completo"
            centeredLabel="Centralizado"
          />
        </WidgetContainer>
      </div>

      <WidgetContainer title="Restaurar" subtitle="Redefinir todas as configurações para o padrão" icon={RotateCcw}>
        <ResetThemeButton label="Restaurar Padrão" />
      </WidgetContainer>
    </div>
  );
}

export default AparenciaContent;
