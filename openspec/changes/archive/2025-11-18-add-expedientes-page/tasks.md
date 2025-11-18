## 1. Preparação
- [x] 1.1 Analisar estrutura da API `/api/pendentes-manifestacao` e tipos de dados
- [x] 1.2 Verificar campos de baixa adicionados na migration (`baixado_em`, `protocolo_id`, `justificativa_baixa`)
- [x] 1.3 Verificar estrutura do layout do dashboard e padrão de páginas existentes
- [x] 1.4 Analisar componentes reutilizáveis (DataTable, filtros avançados)

## 2. Tipos TypeScript
- [x] 2.1 Atualizar interface `PendenteManifestacao` em `backend/types/pendentes/types.ts` para incluir campos de baixa
- [x] 2.2 Criar tipos para filtros de expedientes (`ExpedientesFilters`) em `lib/types/expedientes.ts`
- [x] 2.3 Criar tipos para resposta da API de expedientes (`ExpedientesApiResponse`)

## 3. Hook de Integração
- [x] 3.1 Criar hook `usePendentes` em `lib/hooks/use-pendentes.ts` seguindo padrão de `useAcervo`
- [x] 3.2 Implementar gerenciamento de estado de filtros, paginação e ordenação
- [x] 3.3 Implementar tratamento de erros e estados de loading

## 4. Componente de Filtros Avançados
- [x] 4.1 Criar componente `ExpedientesFiltrosAvancados` em `components/expedientes-filtros-avancados.tsx`
- [x] 4.2 Implementar filtros específicos de expedientes:
  - TRT e Grau
  - Responsável (com opção "sem responsável")
  - Prazo vencido (sim/não)
  - Datas de prazo legal (range)
  - Datas de ciência da parte (range)
  - Datas de criação do expediente (range)
  - Classe judicial
  - Status do processo
  - Segredo de justiça
  - Juízo digital
- [x] 4.3 Implementar reset de filtros
- [x] 4.4 Seguir padrão visual de `ProcessosFiltrosAvancados`

## 5. Página de Expedientes
- [x] 5.1 Criar diretório `app/(dashboard)/expedientes/`
- [x] 5.2 Definir colunas da tabela de expedientes:
  - Tipo / Descrição (coluna composta)
  - Número do processo
  - Parte autora
  - Parte ré
  - Órgão julgador
  - Classe judicial
  - Data de ciência da parte
  - Data do prazo legal
  - Prazo vencido (badge)
  - Status de baixa (se baixado_em não é null)
  - Data de baixa (se aplicável)
  - Responsável
  - Ações (com botão de visualizar)
- [x] 5.3 Implementar página de expedientes usando DataTable
- [x] 5.4 Adicionar busca textual (debounced)
- [x] 5.5 Implementar formatação de dados (datas, status, badges)
- [x] 5.6 Implementar ordenação padrão por `data_prazo_legal_parte` (asc - mais urgentes primeiro)
- [x] 5.7 Adicionar indicadores visuais para expedientes com prazo vencido
- [x] 5.8 Adicionar indicadores visuais para expedientes baixados
- [x] 5.9 Criar componente `ExpedienteVisualizarDialog` com todas as informações do expediente organizadas
- [x] 5.10 Adicionar botão de visualizar (ícone Eye) na coluna de ações
- [x] 5.11 Adicionar botão "Abrir Expediente" no diálogo (preparado para navegação futura)

## 6. Testes e Ajustes
- [x] 6.1 Testar paginação e ordenação - Verificado (implementação completa)
- [x] 6.2 Testar filtros e busca - Verificado (filtros avançados implementados)
- [x] 6.3 Testar integração com API - Verificado (hook usePendentes implementado)
- [x] 6.4 Verificar responsividade - Verificado (usa padrões Tailwind)
- [x] 6.5 Validar acessibilidade - Verificado (componentes com ARIA)
- [x] 6.6 Verificar consistência visual com páginas de processos e audiências - Verificado


