## 1. Preparação
- [ ] 1.1 Analisar estrutura da API `/api/pendentes-manifestacao` e tipos de dados
- [ ] 1.2 Verificar campos de baixa adicionados na migration (`baixado_em`, `protocolo_id`, `justificativa_baixa`)
- [ ] 1.3 Verificar estrutura do layout do dashboard e padrão de páginas existentes
- [ ] 1.4 Analisar componentes reutilizáveis (DataTable, filtros avançados)

## 2. Tipos TypeScript
- [ ] 2.1 Atualizar interface `PendenteManifestacao` em `backend/types/pendentes/types.ts` para incluir campos de baixa
- [ ] 2.2 Criar tipos para filtros de expedientes (`ExpedientesFilters`) em `lib/types/expedientes.ts`
- [ ] 2.3 Criar tipos para resposta da API de expedientes (`ExpedientesApiResponse`)

## 3. Hook de Integração
- [ ] 3.1 Criar hook `usePendentes` em `lib/hooks/use-pendentes.ts` seguindo padrão de `useAcervo`
- [ ] 3.2 Implementar gerenciamento de estado de filtros, paginação e ordenação
- [ ] 3.3 Implementar tratamento de erros e estados de loading

## 4. Componente de Filtros Avançados
- [ ] 4.1 Criar componente `ExpedientesFiltrosAvancados` em `components/expedientes-filtros-avancados.tsx`
- [ ] 4.2 Implementar filtros específicos de expedientes:
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
- [ ] 4.3 Implementar reset de filtros
- [ ] 4.4 Seguir padrão visual de `ProcessosFiltrosAvancados`

## 5. Página de Expedientes
- [ ] 5.1 Criar diretório `app/(dashboard)/expedientes/`
- [ ] 5.2 Definir colunas da tabela de expedientes:
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
- [ ] 5.3 Implementar página de expedientes usando DataTable
- [ ] 5.4 Adicionar busca textual (debounced)
- [ ] 5.5 Implementar formatação de dados (datas, status, badges)
- [ ] 5.6 Implementar ordenação padrão por `data_prazo_legal_parte` (asc - mais urgentes primeiro)
- [ ] 5.7 Adicionar indicadores visuais para expedientes com prazo vencido
- [ ] 5.8 Adicionar indicadores visuais para expedientes baixados

## 6. Testes e Ajustes
- [ ] 6.1 Testar paginação e ordenação
- [ ] 6.2 Testar filtros e busca
- [ ] 6.3 Testar integração com API
- [ ] 6.4 Verificar responsividade
- [ ] 6.5 Validar acessibilidade
- [ ] 6.6 Verificar consistência visual com páginas de processos e audiências


