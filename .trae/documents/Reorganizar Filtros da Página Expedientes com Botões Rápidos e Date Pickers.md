## Objetivo
- Reorganizar a UI de filtros da página Expedientes para deixá-los visíveis e intuitivos.
- Remover filtros do botão atual e posicioná-los na linha inferior.
- Manter na linha superior: caixa de busca e botão de “Novo (+)”.
- Implementar botões rápidos com contagem em tempo real: “Vencidos” e “Sem responsável”.
- Adicionar Date Picker e Range Date Picker do Shadcn UI (suportar uma data única ou intervalo).

## Estado Atual (Confirmado)
- Toolbar atual: `TableToolbar` com busca, filtros e botão novo em `app/(dashboard)/expedientes/page.tsx`.
- Componentes disponíveis: `ButtonGroup`, `Select`, `Combobox`, `Dropdown` e `Calendar` (existe). `DatePicker` e `DateRangePicker` não existem.
- Backend suporta contagens agrupadas via `GET /api/pendentes-manifestacao?agrupar_por=...&incluir_contagem=true` (inclusive `prazo_vencido` e `responsavel_id`).
- Ordenação padrão ajustada quando direction é `null` em `page.tsx:1237` (manter comportamento).

## Proposta de UI
- Linha superior: manter `Search Box` (debounce atual) + botão “Novo expediente”.
- Linha inferior (nova):
  - ButtonGroup com filtros principais visíveis:
    - `TRT` (Select com “Todos”), `Grau` (Select com “Todos”), `Responsável` (Select com “Todos/Sem responsável”), `Tipo` (Select + “Sem Tipo”), `Baixado` (Select com “Todos/Pendentes/Baixados”), `Prazo` (Select com “Todos/No Prazo/Vencidos”).
    - Intervalos de data: controles de Date Picker/Range Date Picker para `data_prazo_legal`, `data_ciencia`, `data_criacao_expediente` e datas comuns (`autuação/arquivamento`).
  - Botões rápidos com badge:
    - “Vencidos” com contador (grupo `prazo_vencido=true`).
    - “Sem responsável” com contador (grupo `responsavel_id=null`).

## Implementação Detalhada
1. Página `app/(dashboard)/expedientes/page.tsx`:
   - Remover uso dos filtros do `TableToolbar` (manter apenas `searchValue`, `onSearchChange` e botão “Novo”).
   - Adicionar uma nova seção de filtros (linha inferior) usando `ButtonGroup` e componentes `Select/Combobox/Dropdown` já existentes.
   - Integrar os controles diretamente aos estados já existentes: `statusBaixa`, `statusPrazo`, `filtros`, `pagina`, `ordenarPor/ordem`.
   - Botões rápidos:
     - “Vencidos”: ao clicar, definir `statusPrazo='vencido'` e `pagina=0`.
     - “Sem responsável”: definir `filtros.sem_responsavel=true`, limpar `filtros.responsavel_id`, `pagina=0`.
   - Contagens em tempo real:
     - Criar `useEffect`/funções de fetch para:
       - `agrupar_por=prazo_vencido` → extrair quantidade do grupo `true`.
       - `agrupar_por=responsavel_id` → extrair quantidade do grupo onde `grupo` é `null`.
     - Renderizar `Badge` nas ações rápidas exibindo o número (0 quando ausente).
   - Manter regra de ordenação padrão (já implementada, linha `1237`).

2. Componentes Date Picker
   - Criar `components/ui/date-picker.tsx`: wrapper baseado em `Calendar` + `Popover` do Shadcn.
     - Seleção de data única.
   - Criar `components/ui/date-range-picker.tsx`: baseado em `react-day-picker` via `Calendar` com `mode='range'`.
     - Permitir seleção de uma única data (normaliza para intervalo `[date, date]`).
   - Se `react-day-picker` não estiver instalado, adicionar como dependência (e estilos se necessário). Caso já esteja presente via `Calendar`, reutilizar.

3. Integração com Backend
   - As chamadas de contagem usarão os mesmos filtros de contexto (TRT, Grau, etc.) para refletir o estado atual ao calcular as badges.
   - Evitar impacto de segurança: manter a lógica que força `responsavel_id=currentUserId` para não-super admin.

4. Validação
   - Testar visualmente todos os controles: seleção, limpeza (opção “Todos”), aplicação imediata, paginação reiniciando em 0.
   - Verificar que a query construída corresponde aos parâmetros do backend (nomes e tipos).
   - Confirmar que as badges atualizam ao mudar qualquer filtro relevante.

5. Extensibilidade
   - Preparar os novos componentes (`date-picker`/`date-range-picker`) para reaproveitamento em outras páginas.
   - Documentar (inline) o uso básico dentro da página e pontos de extensão (sem criar arquivos de documentação agora).

## Observações
- Manter compatibilidade com o design existente e seguir o padrão de imports (`@/components/ui/...`).
- Não alterar o comportamento de segurança de `responsavel_id` para usuários não super admin.
- Performance: usar debounce conservador nas contagens (e.g., 300–500ms) para evitar spam de requisições ao alterar múltiplos filtros rapidamente.

## Confirmação
- Ao aprovar, implemento as alterações na UI da página, adiciono os dois componentes de Date Picker, integro as contagens e entrego verificação funcional completa na própria página Expedientes.