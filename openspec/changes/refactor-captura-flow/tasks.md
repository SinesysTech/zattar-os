## 1. Backend - Serviços de Advogados
- [ ] 1.1 Criar `backend/advogados/services/advogados/criar-advogado.service.ts`
- [ ] 1.2 Criar `backend/advogados/services/advogados/listar-advogados.service.ts`
- [ ] 1.3 Criar `backend/advogados/services/advogados/buscar-advogado.service.ts`
- [ ] 1.4 Criar `backend/advogados/services/advogados/atualizar-advogado.service.ts`
- [ ] 1.5 Criar `backend/advogados/services/persistence/advogado-persistence.service.ts`
- [ ] 1.6 Criar tipos em `backend/types/advogados/types.ts`

## 2. Backend - Serviços de Credenciais
- [ ] 2.1 Criar `backend/advogados/services/credenciais/criar-credencial.service.ts`
- [ ] 2.2 Criar `backend/advogados/services/credenciais/listar-credenciais.service.ts`
- [ ] 2.3 Criar `backend/advogados/services/credenciais/buscar-credencial.service.ts`
- [ ] 2.4 Criar `backend/advogados/services/credenciais/atualizar-credencial.service.ts`
- [ ] 2.5 Criar `backend/advogados/services/persistence/credencial-persistence.service.ts`
- [ ] 2.6 Expandir tipos em `backend/types/captura/trt-types.ts` ou criar `backend/types/credenciais/types.ts`

## 3. API - Endpoints de Advogados
- [ ] 3.1 Criar `app/api/advogados/route.ts` (GET, POST)
- [ ] 3.2 Criar `app/api/advogados/[id]/route.ts` (GET, PATCH)
- [ ] 3.3 Criar `app/api/advogados/[id]/credenciais/route.ts` (GET, POST)
- [ ] 3.4 Criar `app/api/advogados/[id]/credenciais/[credentialId]/route.ts` (PATCH)

## 4. API - Adaptar Endpoints de Captura
- [ ] 4.1 Modificar `app/api/captura/trt/acervo-geral/route.ts` para receber `credencial_ids[]`
- [ ] 4.2 Modificar `app/api/captura/trt/arquivados/route.ts` para receber `credencial_ids[]`
- [ ] 4.3 Modificar `app/api/captura/trt/audiencias/route.ts` para receber `credencial_ids[]`
- [ ] 4.4 Modificar `app/api/captura/trt/pendentes-manifestacao/route.ts` para receber `credencial_ids[]`
- [ ] 4.5 Atualizar `backend/captura/credentials/credential.service.ts` para suportar busca por `credencial_id`

## 5. Backend - Sistema de Histórico de Capturas
- [ ] 5.1 Criar migration para tabela `capturas_log`
- [ ] 5.2 Criar `backend/captura/services/persistence/captura-log-persistence.service.ts`
- [ ] 5.3 Criar `app/api/captura/historico/route.ts` (GET)

## 6. Frontend - Hooks e API Client
- [ ] 6.1 Criar `lib/hooks/use-advogados.ts`
- [ ] 6.2 Criar `lib/hooks/use-credenciais.ts`
- [ ] 6.3 Atualizar `lib/api/captura.ts` para novo formato de requisição

## 7. Frontend - Refatorar CapturaFormBase
- [ ] 7.1 Remover seções de Tribunal e Grau de `components/captura/captura-form-base.tsx`
- [ ] 7.2 Adicionar Select de Advogado (Passo 1)
- [ ] 7.3 Adicionar lista de Credenciais do advogado selecionado (Passo 2)
- [ ] 7.4 Adicionar opção "Marcar todas" nas credenciais
- [ ] 7.5 Remover props relacionadas a tribunais e graus

## 8. Frontend - Adaptar Formulários de Captura
- [ ] 8.1 Atualizar `components/captura/acervo-geral-form.tsx`
- [ ] 8.2 Atualizar `components/captura/arquivados-form.tsx`
- [ ] 8.3 Atualizar `components/captura/audiencias-form.tsx`
- [ ] 8.4 Atualizar `components/captura/pendentes-form.tsx`
- [ ] 8.5 Atualizar função `gerarCombinacoesCaptura` para novo formato

## 9. Frontend - Página de Histórico
- [ ] 9.1 Criar `app/(dashboard)/captura/historico/page.tsx`
- [ ] 9.2 Criar componente para exibir histórico de capturas
- [ ] 9.3 Adicionar link para histórico na página principal de captura

## 10. Testes e Validação
- [ ] 10.1 Testar fluxo completo: Advogado → Credenciais → Captura
- [ ] 10.2 Validar que não há mais redundância de seleção
- [ ] 10.3 Testar histórico de capturas
- [ ] 10.4 Validar resposta assíncrona de capturas longas

