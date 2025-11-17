# Implementation Tasks

## 1. Setup e Tipos
- [ ] 1.1 Criar arquivo `lib/types/contratos.ts` com tipos para API
- [ ] 1.2 Criar arquivo `lib/utils/format-contratos.ts` com funções de formatação
- [ ] 1.3 Criar hook `lib/hooks/use-contratos.ts` para integração com API

## 2. Componentes de Contratos
- [ ] 2.1 Criar `components/contratos/contrato-view-sheet.tsx` para visualização
- [ ] 2.2 Criar `components/contratos/contrato-edit-sheet.tsx` para edição
- [ ] 2.3 Criar `components/contratos/contrato-create-sheet.tsx` para criação
- [ ] 2.4 Criar `components/contratos-filtros-avancados.tsx` para filtros

## 3. Página de Contratos
- [ ] 3.1 Implementar estrutura da página com layout de tabela
- [ ] 3.2 Definir colunas da tabela (data, área de direito, tipo, cliente, status, etc.)
- [ ] 3.3 Implementar barra de busca e filtros avançados
- [ ] 3.4 Implementar botão de criação de novo contrato
- [ ] 3.5 Integrar componentes Sheet (view, edit, create)
- [ ] 3.6 Implementar paginação e controle de estado
- [ ] 3.7 Remover título da página (h1 e p)
- [ ] 3.8 Adicionar coluna de ações com botões de visualizar e editar

## 4. Filtros Avançados
- [ ] 4.1 Implementar filtro por área de direito
- [ ] 4.2 Implementar filtro por tipo de contrato
- [ ] 4.3 Implementar filtro por tipo de cobrança
- [ ] 4.4 Implementar filtro por status
- [ ] 4.5 Implementar filtro por cliente
- [ ] 4.6 Implementar filtro por responsável
- [ ] 4.7 Adicionar indicador visual quando filtros estão ativos
- [ ] 4.8 Implementar botão de limpar filtros

## 5. Formatação e Validação
- [ ] 5.1 Criar formatadores para área de direito
- [ ] 5.2 Criar formatadores para tipo de contrato
- [ ] 5.3 Criar formatadores para tipo de cobrança
- [ ] 5.4 Criar formatadores para status
- [ ] 5.5 Criar formatadores para polo processual
- [ ] 5.6 Criar formatadores para datas (contratação, assinatura, distribuição)

## 6. Integração e Testes
- [ ] 6.1 Testar listagem de contratos com diferentes filtros
- [ ] 6.2 Testar criação de novo contrato
- [ ] 6.3 Testar edição de contrato existente
- [ ] 6.4 Testar visualização de detalhes do contrato
- [ ] 6.5 Testar paginação e busca
- [ ] 6.6 Verificar responsividade da tabela
- [ ] 6.7 Validar consistência visual com outras páginas
- [ ] 6.8 Testar estados de loading e erro

## 7. Refinamentos
- [ ] 7.1 Ajustar alinhamento de colunas e células
- [ ] 7.2 Implementar badges coloridas para status
- [ ] 7.3 Implementar badges coloridas para tipo de contrato
- [ ] 7.4 Adicionar tooltips onde necessário
- [ ] 7.5 Otimizar performance da tabela
- [ ] 7.6 Revisar acessibilidade (labels, aria-labels)
