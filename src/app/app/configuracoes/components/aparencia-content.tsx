'use client';

/**
 * AparenciaContent - Componente de configurações de aparência/tema
 *
 * Centraliza todas as opções de personalização de tema em um único local,
 * organizadas em cards responsivos com labels em português.
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PresetSelector,
  ColorModeSelector,
  ThemeScaleSelector,
  ThemeRadiusSelector,
  ContentLayoutSelector,
  SidebarModeSelector,
  ResetThemeButton,
} from '@/components/layout/header/theme-customizer';

/**
 * Componente principal de configurações de aparência
 * 
 * Renderiza todos os seletores de tema em um layout organizado com cards.
 * Cada card agrupa configurações relacionadas com título e descrição explicativa.
 */
export function AparenciaContent() {
  return (
    <div className="space-y-6">
      {/* Grid de cards com configurações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Tema (Preset) */}
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>Escolha o esquema de cores da aplicação</CardDescription>
          </CardHeader>
          <CardContent>
            <PresetSelector label="Tema" placeholder="Selecione um tema" />
          </CardContent>
        </Card>

        {/* Card: Modo de Cor (Light/Dark) */}
        <Card>
          <CardHeader>
            <CardTitle>Modo de Cor</CardTitle>
            <CardDescription>Alterne entre modo claro e escuro</CardDescription>
          </CardHeader>
          <CardContent>
            <ColorModeSelector 
              label="Modo de cor" 
              lightLabel="Claro" 
              darkLabel="Escuro" 
            />
          </CardContent>
        </Card>

        {/* Card: Escala */}
        <Card>
          <CardHeader>
            <CardTitle>Escala</CardTitle>
            <CardDescription>Ajuste o tamanho dos elementos da interface</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeScaleSelector label="Escala" />
          </CardContent>
        </Card>

        {/* Card: Arredondamento */}
        <Card>
          <CardHeader>
            <CardTitle>Arredondamento</CardTitle>
            <CardDescription>Defina o raio das bordas dos componentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeRadiusSelector label="Arredondamento" />
          </CardContent>
        </Card>

        {/* Card: Layout do Conteúdo (apenas desktop) */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Layout do Conteúdo</CardTitle>
            <CardDescription>Escolha a largura da área de conteúdo</CardDescription>
          </CardHeader>
          <CardContent>
            <ContentLayoutSelector 
              label="Layout do conteúdo"
              fullLabel="Completo"
              centeredLabel="Centralizado"
            />
          </CardContent>
        </Card>

        {/* Card: Modo da Barra Lateral (apenas desktop) */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Modo da Barra Lateral</CardTitle>
            <CardDescription>Barra lateral expandida ou apenas ícones</CardDescription>
          </CardHeader>
          <CardContent>
            <SidebarModeSelector 
              label="Modo da barra lateral"
              defaultLabel="Padrão"
              iconLabel="Ícone"
            />
          </CardContent>
        </Card>
      </div>

      {/* Card: Botão de Reset */}
      <Card>
        <CardContent className="pt-6">
          <ResetThemeButton label="Restaurar Padrão" />
        </CardContent>
      </Card>
    </div>
  );
}

export default AparenciaContent;
