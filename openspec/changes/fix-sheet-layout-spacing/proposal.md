# Change: Padronizar Layout e Espaçamento dos Componentes Sheet

## Why
Os componentes Sheet (lateral slides) utilizados em todo o sistema apresentam problemas de layout e usabilidade que impactam negativamente a experiência do usuário:
- Textos cortados e falta de margens adequadas
- Ausência de hierarquia visual clara entre títulos e conteúdo
- Organização inconsistente dos elementos internos
- Subtítulos desnecessários que poluem a interface
- Falta de padronização entre diferentes implementações de Sheet

Essas inconsistências aparecem em múltiplos contextos: formulários de criação (novo usuário, novo cliente, etc.) e filtros avançados em várias páginas.

## What Changes
- Remover subtítulos redundantes dos Sheets (ex: "Preencha os dados para criar um novo usuário no sistema")
- Ajustar tamanho da fonte dos títulos principais para criar hierarquia visual adequada
- Implementar sistema de espaçamento consistente com margens e padding apropriados
- Padronizar layout interno dos Sheets em todas as páginas:
  - Usuários (novo usuário, edição, visualização)
  - Clientes (novo cliente, filtros avançados)
  - Processos (filtros avançados)
  - Audiências (filtros avançados)
  - Pendências (filtros avançados)
  - Outras páginas que utilizam Sheet
- Estabelecer guia de estilo para componentes Sheet seguindo princípios de UI/UX
- Garantir que inputs, labels e botões tenham espaçamento adequado
- Implementar hierarquia visual clara: Título > Seções > Campos

## Impact
- Affected specs: Nova capacidade `ui-components` (Sheet component guidelines)
- Affected code:
  - `components/ui/sheet.tsx` (shadcn/ui base component - se necessário customizar)
  - `components/usuarios/usuario-create-sheet.tsx`
  - `components/usuarios/usuario-edit-sheet.tsx`
  - `components/usuarios/usuario-view-sheet.tsx`
  - `components/usuarios/usuarios-filtros-avancados.tsx`
  - `components/clientes/cliente-create-sheet.tsx` (se existir)
  - `components/clientes/clientes-filtros-avancados.tsx` (se existir)
  - `components/processos/processos-filtros-avancados.tsx` (se existir)
  - `components/audiencias/audiencias-filtros-avancados.tsx`
  - `components/expedientes/expedientes-filtros-avancados.tsx` (se existir)
  - Qualquer outro componente que utilize Sheet
- Design tokens a definir:
  - Espaçamento padrão entre elementos
  - Tamanhos de fonte para hierarquia
  - Padding interno do Sheet
  - Largura máxima do conteúdo

## Design Decisions

### Espaçamento e Margens
- Padding lateral do Sheet: `24px` (p-6)
- Padding vertical do header: `20px` (py-5)
- Espaçamento entre campos de formulário: `16px` (gap-4)
- Espaçamento entre seções: `24px` (gap-6)

### Hierarquia Tipográfica
- Título principal: `text-xl font-semibold` (20px)
- Seções/grupos: `text-sm font-medium` (14px)
- Labels: `text-sm` (14px)
- Textos auxiliares: `text-xs text-muted-foreground` (12px)

### Estrutura Padrão
```tsx
<Sheet>
  <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
    <SheetHeader className="pb-5">
      <SheetTitle className="text-xl">Título Principal</SheetTitle>
      {/* Remover SheetDescription se for redundante */}
    </SheetHeader>

    <div className="space-y-6">
      {/* Conteúdo organizado em seções */}
      <div className="space-y-4">
        {/* Campos de formulário ou filtros */}
      </div>
    </div>

    <SheetFooter className="pt-6">
      {/* Botões de ação */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

## Benefits
- Melhoria significativa na experiência do usuário
- Interface mais limpa e profissional
- Consistência visual em todo o sistema
- Facilita manutenção futura (padrão estabelecido)
- Reduz carga cognitiva ao remover elementos redundantes
- Melhora acessibilidade com hierarquia clara
