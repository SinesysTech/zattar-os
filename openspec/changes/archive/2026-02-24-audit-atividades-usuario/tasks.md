## 1. Repository (Backend Data Layer)

- [x] 1.1 Criar `src/features/usuarios/repository-audit-atividades.ts` com interface `AtividadeLog` (id, tipoEntidade, entidadeId, tipoEvento, usuarioQueExecutouId, responsavelAnteriorId, responsavelNovoId, dadosEvento, createdAt, nomeResponsavelAnterior, nomeResponsavelNovo)
- [x] 1.2 Implementar função `buscarAtividadesUsuario(usuarioId, limite, offset)` com query em `logs_alteracao` + LEFT JOIN em `usuarios` para nomes de responsáveis, ordenado por `created_at` DESC
- [x] 1.3 Implementar função `contarAtividadesUsuario(usuarioId)` para saber se há mais registros (suporte ao "Carregar mais")

## 2. Server Action

- [x] 2.1 Criar `src/features/usuarios/actions/audit-atividades-actions.ts` com action `actionBuscarAtividadesUsuario(usuarioId, limite?, offset?)` protegida pela permissão `usuarios:visualizar`
- [x] 2.2 Retornar `{ success, data: { atividades, temMais } }` com tipagem adequada

## 3. Componente AtividadesRecentes

- [x] 3.1 Criar mapas de configuração por tipo de evento: `EVENT_ICONS`, `EVENT_LABELS`, `EVENT_COLORS` (atribuicao_responsavel, transferencia_responsavel, desatribuicao_responsavel, mudanca_status, observacao_adicionada, fallback)
- [x] 3.2 Criar mapa de labels por tipo de entidade: `ENTITY_LABELS` (acervo→Processo, audiencias→Audiência, expedientes→Expediente, contratos→Contrato, etc.)
- [x] 3.3 Criar função `gerarDescricaoEvento(atividade)` que produz descrição humanizada com nomes de responsáveis e tipo de entidade
- [x] 3.4 Reescrever `src/features/usuarios/components/activities/atividades-recentes.tsx` com: loading skeleton, empty state, timeline de eventos com ícones/cores/timestamps relativos (seguir padrão `AuthLogsTimeline`)
- [x] 3.5 Implementar botão "Carregar mais" que incrementa offset e concatena novos resultados ao estado existente

## 4. Integração e Exports

- [x] 4.1 Exportar nova action e tipos no barrel da feature `usuarios` (index.ts)
- [x] 4.2 Verificar que `AtividadesRecentes` já está integrado na página de detalhes (`usuario-detalhes.tsx`) nas tabs "Visão Geral" e "Atividades"

## 5. Validação

- [x] 5.1 Verificar build TypeScript sem erros (`npx tsc --noEmit`)
- [ ] 5.2 Testar visualmente: timeline com dados reais, empty state, loading state, e "Carregar mais"
