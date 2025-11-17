# Implementation Tasks

## 1. Setup e Tipos
- [x] 1.1 Criar arquivo `lib/types/contratos.ts` com tipos para API
- [x] 1.2 Criar arquivo `lib/utils/format-contratos.ts` com funções de formatação
- [x] 1.3 Criar hook `lib/hooks/use-contratos.ts` para integração com API

## 2. Componentes de Contratos
- [x] 2.1 Criar `components/contratos/contrato-view-sheet.tsx` para visualização
- [x] 2.2 Criar `components/contratos/contrato-edit-sheet.tsx` para edição
- [x] 2.3 Criar `components/contratos/contrato-create-sheet.tsx` para criação
- [x] 2.4 Criar `components/contratos-filtros-avancados.tsx` para filtros

## 3. Página de Contratos
- [x] 3.1 Implementar estrutura da página com layout de tabela
- [x] 3.2 Definir colunas da tabela (data, área de direito, tipo, cliente, status, etc.)
- [x] 3.3 Implementar barra de busca e filtros avançados
- [x] 3.4 Implementar botão de criação de novo contrato
- [x] 3.5 Integrar componentes Sheet (view, edit, create)
- [x] 3.6 Implementar paginação e controle de estado
- [x] 3.7 Remover título da página (h1 e p)
- [x] 3.8 Adicionar coluna de ações com botões de visualizar e editar

## 4. Filtros Avançados
- [x] 4.1 Implementar filtro por área de direito
- [x] 4.2 Implementar filtro por tipo de contrato
- [x] 4.3 Implementar filtro por tipo de cobrança
- [x] 4.4 Implementar filtro por status
- [x] 4.5 Implementar filtro por cliente
- [x] 4.6 Implementar filtro por responsável
- [x] 4.7 Adicionar indicador visual quando filtros estão ativos
- [x] 4.8 Implementar botão de limpar filtros

## 5. Formatação e Validação
- [x] 5.1 Criar formatadores para área de direito
- [x] 5.2 Criar formatadores para tipo de contrato
- [x] 5.3 Criar formatadores para tipo de cobrança
- [x] 5.4 Criar formatadores para status
- [x] 5.5 Criar formatadores para polo processual
- [x] 5.6 Criar formatadores para datas (contratação, assinatura, distribuição)

## 6. Integração e Testes
- [x] 6.1 Testar listagem de contratos com diferentes filtros
- [x] 6.2 Testar criação de novo contrato
- [x] 6.3 Testar edição de contrato existente
- [x] 6.4 Testar visualização de detalhes do contrato
- [x] 6.5 Testar paginação e busca
- [x] 6.6 Verificar responsividade da tabela
- [x] 6.7 Validar consistência visual com outras páginas
- [x] 6.8 Testar estados de loading e erro

## 7. Refinamentos
- [x] 7.1 Ajustar alinhamento de colunas e células
- [x] 7.2 Implementar badges coloridas para status
- [x] 7.3 Implementar badges coloridas para tipo de contrato
- [x] 7.4 Adicionar tooltips onde necessário
- [x] 7.5 Otimizar performance da tabela
- [x] 7.6 Revisar acessibilidade (labels, aria-labels)
