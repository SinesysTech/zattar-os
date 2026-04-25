★ Insight ─────────────────────────────────────
Com os 4 agentes retornando uniformemente (overview + walkthrough + descobertas + lista de problemas), posso agora consolidar em um único relatório navegável. Ao invés de colar 4 respostas em sequência, vou unificá-las por camada lógica (captura → dados → views → interações) e no final agregar uma única lista de problemas priorizada por severidade — isso evita duplicação e dá ao usuário uma leitura de cima-para-baixo.
─────────────────────────────────────────────────

Auditoria Completa — Módulo expedientes (ZattarOS)
Abaixo está a análise consolidada das 4 dimensões investigadas em paralelo, todas com a mesma profundidade. As seções 1–4 descrevem o sistema; a seção 5 é a lista única de problemas priorizada.

1. Captura de Expedientes (pipeline PJe-TRT)

1.1 Visão conceitual
A captura é um scraper orientado ao advogado que sincroniza, sob demanda, os processos pendentes de manifestação no PJe-TRT com a tabela local expedientes. O fluxo:

Advogado autentica no PJe via SSO PDPJ + OTP (Playwright).
Sistema lista todos os processos pendentes (filtros de prazo: "no prazo" e "sem prazo").
Extrai metadados complementares (timeline, partes).
Persiste no Supabase e, opcionalmente, baixa o PDF do documento para o Backblaze B2.
A re-captura é inerente ao modelo: a cada execução, o sistema faz lookup por (id_pje, trt, grau, numero_processo) e usa compararObjetos() (comparison.util.ts:39) para detectar diffs. Se idêntico, não faz nada; se diferente, grava dados_anteriores (JSONB) e atualiza. A fronteira conceitual é clara: captura orquestra (auth → listagem → enriquecimento → persistência); expedientes é a entidade persistida.

1.2 Walkthrough técnico
Disparo — pendentes-manifestacao.service.ts:134 pendentesManifestacaoCapture(credencial, config, flags).
Autenticação — pendentes-manifestacao.service.ts:144 autenticarPJE() (SSO + OTP → JWT + cookies).
Totalizadores — obter-totalizadores.ts:41 valida a contagem esperada.
Paginação — obter-todos-processos.ts:85 itera páginas com delay 500ms; cada página em obter-processos.ts:74 via fetch.ts com retry exponencial.
Dedupe — pendentes-manifestacao.service.ts:212 monta Set<idProcesso>.
Dados complementares — pendentes-manifestacao.service.ts:221 busca timeline + partes com horasParaRecaptura: 24.
Persistência em lote — pendentes-persistence.service.ts:103 faz batch lookup .in("id_pje", idsPje) (linha 131), compara via JSON.stringify(sortKeysDeep()), e faz insert ou update com dados_anteriores.
Documento PDF — pje-expediente-documento.service.ts:219 GET /pje-comum-api/.../documentos/id/{id}/conteudo, converte base64 → Buffer → upload B2 → atualizarDocumentoPendente() em pendentes-persistence.service.ts:291.
Finally — pendentes-manifestacao.service.ts:512 fecha o browser.
1.3 Descobertas
Batch-first anti-N+1 correto no lookup principal — .in(...) + Map O(1).
Retry com backoff exponencial em fetch.ts:224 (status 429/500-504 retentáveis).
WeakMap cache de origin em fetch.ts:147.
Raw payloads coletados para auditoria em pendentes-manifestacao.service.ts:463.

2. Camada de Dados & Permissões

2.1 Visão conceitual
A arquitetura segue FSD com colocation rigoroso em (authenticated)/expedientes/: domain (Zod + tipos), service (regras), repository (Supabase), actions (Server Actions). O fluxo é unidirecional: Client → Action → Service → Repository → Supabase.

Permissões em três camadas:
RLS abrangente: authenticated pode SELECT/UPDATE em expedientes (sem eq(tenant_id, ...)).
Service layer valida invariantes ("já baixado?", "está baixado antes de reverter?").
Wrapper authenticatedAction em safe-action.ts garante auth, mas não diferencia roles (admin vs user).
Operações expostas: criar, atualizar, listar, baixar, reverter baixa, alterar responsável (bulk), baixar bulk. Todas também aparecem como MCP tools em expedientes-tools.ts reutilizando as mesmas actions.

2.2 Walkthrough técnico
Criar — expediente-actions.ts:52-210 valida com createExpedienteSchema (domain.ts:135), chama service.ts:34, repo insere em repository.ts:395. revalidatePath + hooks after() para indexação RAG.
Atualizar — parsing manual customizado de FormData (expediente-actions.ts:226), updateExpedienteSchema.partial(), grava dados_anteriores em repository.ts:437.
Baixar — valida protocoloId || justificativaBaixa (domain.ts:191). Service verifica "já baixado?" (service.ts:102), chama RPC registrar_baixa_expediente para auditoria. Falha de RPC não aborta (service.ts:121-129).
Reverter — exige estado "baixado" (service.ts:144), RPC registrar_reversao_baixa_expediente.
Bulk transferir — expediente-bulk-actions.ts:92 usa Promise.allSettled (não-transacional); RPC atribuir_responsavel_pendente com set_config('app.current_user_id', ...) para trigger de auditoria.
Listar — repository.ts:186-333 usa view expedientes_com_origem (LEFT JOIN com dados_primeiro_grau). Ordenação padrão por data_prazo_legal_parte ASC, paginação OFFSET/LIMIT.
2.3 Descobertas
RLS minimalista por design: permissões granulares vivem em service + RPCs com SECURITY DEFINER, não em policies.
RPCs com auditoria transacional embutem o log dentro da mesma transação.
Bulk não-transacional: Promise.allSettled permite resultados parciais.

3. Views & Páginas

3.1 Visão conceitual
Sete views: / (quadro), /lista, /semana, /mes, /ano, /quadro, /[id]. Padrão Server Component wrapper + Client Component stateful: cada page.tsx é RSC com export const dynamic = 'force-dynamic', envolve PageShell, usa Suspense e delega para expedientes-content.tsx (client component monolítico).

Filtros globais (status, TRT, grau, origem, responsável, tipo) vivem em useState local (expedientes-content.tsx:87-98) — sem persistência em URL. useEffect sincroniza viewMode com pathname unidirecionalmente (linhas 106-109).

3.2 Walkthrough
Raiz + temporais — todas idênticas: RSC → PageShell → Suspense → ExpedientesContent visualizacao="...".
Detalhe [id] — Server async com params: Promise<{id: string}> (page.tsx:10), valida Number.parseInt, renderiza com MOCK_DATA_BUNDLE hardcoded (page.tsx:28) — não busca dados reais.
Orquestrador — expedientes-content.tsx chama useExpedientes() três vezes (dados, contagem de pendentes, contagem de baixados).
Quadro — cards Glass com urgência por cor + popovers inline (responsável, tipo, prazo).
Semana/Mês/Ano — date-fns + locale ptBR; calendarios/heatmap; navegação prev/next.
Filtros — expedientes-filter-bar.tsx emite via callback, sem useSearchParams.
3.3 Descobertas
Design System Glass Briefing respeitado nos principais components (tokens OKLCH, Heading/Text, GlassPanel).
ARIA razoável: aria-live="polite", aria-busy, role="status" em empty/loading.
font-mono em timestamps (violação): expediente-detalhes-client.tsx:305,321,326,346,368,390.
Tamanhos de fonte literais (text-[10px], text-[9px]) no detalhe — violação do DS.

4. Componentes Interativos (edição)

4.1 Visão conceitual
O usuário executa ações em três padrões complementares:

Dialogs pesados (DialogFormShell) — criar, baixar, reverter, bulk.
Popovers inline — tipo, responsável, prazo (edição rápida direto na tabela).
Células editáveis — descrição, observações via EditableTextCell.
useActionState é o padrão dominante em dialogs. Popovers disparam actionAtualizarExpedientePayload imediatamente após seleção ("persist on select"). Validação client-side é mínima — toda validação pesada vive no Zod server-side.

4.2 Walkthrough
Criar — expediente-dialog.tsx:1-854 em 3 etapas (tribunal+grau → processo → dados). useState múltiplo, sem react-hook-form.
Baixar — expedientes-baixar-dialog.tsx mostra campo "Resultado da Decisão" condicionalmente para tipos recursais (sem transição visual).
Reverter baixa — expedientes-reverter-baixa-dialog.tsx:29-98 sem double-confirm.
Bulk — expedientes-bulk-actions.tsx + dialogs dedicados sem preview dos itens afetados.
Popovers — expediente-responsavel-popover.tsx, -tipo-popover.tsx, -prazo-popover.tsx — persistem direto na seleção, sem optimistic UI.
Text editor — expediente-text-editor.tsx:1-67 é text plano (sem HTML rico), logo sem risco XSS.

4.3 Descobertas
useActionState estabelecido e consistente.
Sem otimistic UI em lugar nenhum — toda UI espera o servidor.
Sem focus-return após fechar dialog.
sonner como toast padrão.

5. Lista consolidada de problemas (priorizada)

Crítico
#	Problema	Arquivo:linha	Impacto	Correção
1	Service-role key lida via env em server client — se .env.local vazar ou for versionado, bypass total de RLS	db-client.ts:25-26	Controle total do banco	Verificar .gitignore, secrets manager, rotacionar chaves, restringir uso server-only

Alto
#	Problema	Arquivo:linha	Impacto	Correção
2	Bulk operations via Promise.allSettled sem transação — resultados parciais persistem	expediente-bulk-actions.ts:92	50/100 baixados e 50 não; estado inconsistente	RPC bulk_baixar_expedientes all-or-nothing
3	Página de detalhe [id] usa MOCK_DATA_BUNDLE hardcoded — ignora ID real	[id]/page.tsx:28	Produção renderiza dados fake para qualquer ID	Fetch real no server, validação Zod, error boundaries
4	console.log('DEBUG - Response JSON:', ...) em produção	pje-expediente-documento.service.ts:94	Vazamento de payloads do PJe em logs	Remover ou condicionar a process.env.DEBUG
5	Update de expediente (re-captura) sem transação/lock — race se múltiplos scrapers rodarem para o mesmo advogado	pendentes-persistence.service.ts:196-240	Corrompe dados_anteriores, perdas de diff	RPC atômica com versioning ou SELECT ... FOR UPDATE
6	Filtros globais não persistem em URL — trocar view ou refresh reseta tudo	expedientes-content.tsx:96-98	Fluxo interrompido; sem deep-link	Sincronizar com useSearchParams
7	Reverter baixa destrói protocolo/justificativa com único clique de confirmação	expedientes-reverter-baixa-dialog.tsx:29-98	Perda acidental de dados auditáveis	Exigir digitação de "confirmar" ou double-modal
8	ExpedientesContent é monólito client — renderiza o código de 5 views simultaneamente	expedientes-content.tsx:1	Re-renders em cascata; bundle inflado	Split em sub-componentes com dynamic() lazy

Médio
#	Problema	Arquivo:linha	Impacto	Correção
9	RPC de auditoria de baixa pode falhar silenciosamente; expediente fica baixado sem log	service.ts:113-129	Rastreabilidade incompleta	Decisão documentada: revert ou propagar erro
10	N+1 em lookup de acervo dentro do loop de partes	pendentes-manifestacao.service.ts:293-305	100 queries para 100 processos	.in("id_pje", ids) + Map
11	useExpedientes disparado 3× (dados + 2 contadores) sem cache	expedientes-content.tsx:124-150	3 actions redundantes por render	React Query/SWR ou agregar contadores na resposta principal
12	Sem validação client-side em dialogs (Zod só no server)	expediente-dialog.tsx:379-384, expedientes-baixar-dialog.tsx:93-102	Feedback lento em rede ruim	react-hook-form + zodResolver com schema partilhado
13	Bulk dialogs sem preview/sumário dos itens afetados	expedientes-bulk-transferir-dialog.tsx, expedientes-bulk-baixar-dialog.tsx	Risco de aplicar a seleção incorreta	Seção "Resumo" com lista scrollável
14	Sem loading state durante mutação em popovers inline	expediente-responsavel-popover.tsx:89-104	Usuário não sabe se ação completou	Manter popover aberto com spinner durante isPending
15	Sem otimistic UI — toda célula espera o servidor	columns.tsx:117-164	UX lenta em rede alta latência	Atualizar estado local + rollback em erro
16	Parsing manual de FormData duplicado em actionAtualizarExpediente	expediente-actions.ts:226-261	Lógica fragmentada; dois padrões	Usar wrapper safe-action.ts unificado
17	Hooks after() (indexação RAG, automação) sem tratamento robusto	expediente-actions.ts:128-194	Busca IA não encontra; sem feedback ao usuário	Tabela de jobs + UI de status
18	Sem revalidatePath/revalidateTag após mutação — depende de refetch manual	expedientes-content.tsx:252-254	Possível desincronia	Adicionar revalidação nas actions
19	font-mono em timestamps/horários (violação explícita do Glass Briefing)	expediente-detalhes-client.tsx:305,321,346	Inconsistência visual; quebra DS	Substituir por <Text variant="caption"> — manter mono apenas em número de processo
20	Tamanhos de fonte literais text-[10px], text-[9px] em vez de tokens	expediente-detalhes-client.tsx:305,321,346	Fora do DS; manutenção difícil	<Heading> / <Text> canônicos
21	parseDate() assume Brasília UTC-3 implícito em todas as datas da API	pendentes-persistence.service.ts:52-67	Off de 3h+ em relatórios e filtros	Documentar contrato + date-fns-tz explícito
22	Documento órfão: atualizarDocumentoPendente chamada sem validar que expedienteId foi inserido	pje-expediente-documento.service.ts:272-274	arquivo_* aponta para ID inexistente	Validar data?.id antes do upload
23	Sem virtualização em ExpedientesGlassList	expedientes-list-wrapper.tsx:1-99	Scroll lag com pageSize=50+	@tanstack/react-virtual
24	Empty state único para "sem dados" vs "filtro vazio"	expedientes-content.tsx:337-361	Usuário confunde filtro restritivo com ausência de dados	3 estados semânticos distintos
25	Tipo de expediente condiciona campo "Resultado da Decisão" sem transição/hint	expedientes-baixar-dialog.tsx:48-54,205-244	Usuário recebe erro server-side sem saber por quê	Collapsible animado + label explicativa
26	Bulk baixa reporta "X baixados" mas não lista falhas parciais	expedientes-bulk-baixar-dialog.tsx:48-57	Usuário não sabe o que não foi baixado	Retornar { successIds, failedIds, errors }
27	actionBulkTransferirResponsavel não valida responsavelId ativo antes de disparar RPC	expediente-bulk-actions.ts:29-122	Falhas parciais com mensagem obscura	SELECT 1 FROM usuarios WHERE id = $1 antes
28	findExpedienteById retorna origem campos potencialmente null sem documentação	repository.ts:163-166	Runtime error em getExpedientePartyNames	Documentar contrato + testes com expedientes sem origem

Baixo
#	Problema	Arquivo:linha	Impacto	Correção
29	findExpedientesByClienteCPF faz 2 queries sequenciais	repository.ts:554-642	Performance em busca por CPF	CTE/JOIN único + índice em clientes(cpf)
30	Schema Zod permite numero opcional mas banco pode exigir	domain.ts:135-166	INSERT falha com erro de FK	Sincronizar schema ↔ migration
31	actionCriarExpediente usa authenticateRequest() manual em vez do wrapper	expediente-actions.ts:52-210	Dois padrões no codebase	Migrar para authenticatedFormAction
32	AdvogadoInfo sem validação Zod — parseInt pode lançar	pendentes-manifestacao.service.ts:158-160	Runtime error obscuro	z.object({ idAdvogado: z.coerce.number().int() })
33	fetch.ts considera {} e [] como resposta válida sem schema	fetch.ts:235-236	Mascara API changes	Schema Zod por endpoint
34	useSearchParams usado em expedientes-table-wrapper.tsx desconectado dos filtros modernos	expedientes-table-wrapper.tsx:92,126,137	Dead code / duas fontes da verdade	Remover ou consolidar
35	Falta aria-invalid + aria-describedby em campos com erro	expediente-dialog.tsx:531-537	Screen readers não sinalizam erro	Adicionar atributos ARIA
36	Sem retry em carregamento de combos (processos, tipos, usuários)	expediente-dialog.tsx:193-246	UX quebra em rede instável	Botão "Tentar novamente" + retry exponencial
37	Botões desabilitados sem tooltip explicativo	expedientes-bulk-transferir-dialog.tsx:90-98	Usuário não sabe o porquê	<Tooltip> ou title
38	Labels hardcoded em inglês coexistem com ptBR do date-fns	expedientes-semana-view.tsx:22	Inconsistência de idioma	i18n centralizado
39	TODO explícito: salvarLogCaptura é placeholder	repository.ts:109	Baixa — log adicional nunca persistido	Implementar ou remover
40	sincronização viewMode ↔ URL é unidirecional	expedientes-content.tsx:106-109	Back button pode ficar confuso	Hook useViewMode(pathname) bidirecional

Resumo executivo
★ Insight ─────────────────────────────────────
O módulo é arquiteturalmente sólido (FSD + colocation, separação clara domain/service/repository, RPCs com auditoria transacional, pipeline de captura com batching e retry), mas tem três classes de dívida técnica que merecem atenção:

Integridade em operações em massa — Promise.allSettled sem transação para bulk é o risco mais sistêmico.
UX de mutação — zero otimistic UI, sem persistência de filtros em URL, sem preview de bulk, sem double-confirm em reverter baixa.
Dívida de dados — página de detalhe ainda em mocks, auditoria que pode falhar silenciosamente, datas sem timezone explícito. ─────────────────────────────────────────────────
Prioridades de remediação sugeridas (ordem recomendada):

Crítico/Alto #1, #3, #4 — segurança/prod: service-role key, mocks no [id], console.log com payload.
Alto #2, #5 — integridade: transações em bulk e re-captura.
Alto #6, #7, #8 — UX fundamental: URL-sync de filtros, double-confirm, split do monólito.
Médios — polimento (otimistic UI, preview bulk, loading states, DS compliance).
Baixos — higienização gradual (ARIA, i18n, dead code, tooltips).
O relatório contém 40 achados (1 Crítico, 7 Altos, 20 Médios, 12 Baixos) com referências clicáveis para navegação direta ao arquivo/linha.