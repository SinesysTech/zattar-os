# Tasks: Integração Comunica CNJ - Fase 1 (Backend)

## Modelagem de Dados

- [x] Criar migração: enum `origem_expediente` ('captura', 'manual', 'comunica_cnj')
- [x] Criar migração: enum `meio_comunicacao` ('E', 'D')
- [x] Criar migração: renomear `pendentes_manifestacao` → `expedientes`
- [x] Criar migração: adicionar coluna `origem` na tabela `expedientes`
- [x] Criar migração: migrar dados de `expedientes_manuais` para `expedientes`
- [x] Criar migração: dropar tabela `expedientes_manuais`
- [x] Criar migração: adicionar `comunica_cnj` ao enum `tipo_captura`
- [x] Criar migração: criar tabela `comunica_cnj`
- [x] Criar migração: RLS e triggers para `comunica_cnj`
- [x] Atualizar índices e constraints

## Refatoração de Código

- [x] Atualizar referências de `pendentes_manifestacao` para `expedientes` no backend
- [x] Atualizar referências de `pendentes_manifestacao` para `expedientes` nos tipos TypeScript
- [x] Atualizar referências de `pendentes_manifestacao` para `expedientes` nas API routes
- [x] Remover código relacionado a `expedientes_manuais`

## Backend - Cliente HTTP

- [x] Criar `backend/comunica-cnj/client/comunica-cnj-client.ts`
- [x] Implementar método `consultarComunicacoes(params)`
- [x] Implementar método `obterCertidao(hash)`
- [x] Implementar método `listarTribunais()`
- [x] Implementar método `obterCaderno(sigla, data, meio)`
- [x] Implementar controle de rate limiting
- [x] Implementar retry logic com backoff

## Backend - Tipos

- [x] Criar `backend/comunica-cnj/types/types.ts`
- [x] Definir interface `ComunicacaoItem` (resposta da API)
- [x] Definir interface `ComunicacaoAPIParams` (parâmetros de busca)
- [x] Definir interface `ComunicacaoAPIResponse` (resposta paginada)
- [x] Definir interface `ComunicaCNJ` (entidade do banco)
- [x] Definir interface `CriarExpedienteFromCNJParams`

## Backend - Persistência

- [x] Criar `backend/comunica-cnj/services/persistence/comunica-cnj-persistence.service.ts`
- [x] Implementar `inserirComunicacao(data)`
- [x] Implementar `buscarPorHash(hash)`
- [x] Implementar `listarComunicacoes(filtros)`
- [x] Implementar `vincularExpediente(comunicacaoId, expedienteId)`

## Backend - Serviços de Negócio

- [x] Criar `backend/comunica-cnj/services/comunica-cnj/buscar-comunicacoes.service.ts`
- [x] Criar `backend/comunica-cnj/services/comunica-cnj/obter-certidao.service.ts`
- [x] Criar `backend/comunica-cnj/services/comunica-cnj/capturar-comunicacoes.service.ts`
- [x] Implementar lógica de inferência de grau (Vara=1º, Turma/Gabinete=2º, Ministro=TST)
- [x] Implementar lógica de extração de partes (polo ativo/passivo) dos destinatários
- [x] Implementar lógica de match comunicação ↔ expediente (janela 3 dias)
- [x] Implementar criação automática de expediente quando não há match

## Backend - API Routes

- [x] Criar `app/api/comunica-cnj/consulta/route.ts` (GET - busca manual)
- [x] Criar `app/api/comunica-cnj/certidao/[hash]/route.ts` (GET - PDF)
- [x] Criar `app/api/comunica-cnj/tribunais/route.ts` (GET - lista tribunais)
- [x] Criar `app/api/comunica-cnj/captura/route.ts` (POST - executar captura)
- [x] Adicionar autenticação nas routes
- [x] Adicionar validação de parâmetros com Zod

## Documentação API

- [x] Adicionar annotations Swagger para `/api/comunica-cnj/consulta`
- [x] Adicionar annotations Swagger para `/api/comunica-cnj/certidao/[hash]`
- [x] Adicionar annotations Swagger para `/api/comunica-cnj/tribunais`
- [x] Adicionar annotations Swagger para `/api/comunica-cnj/captura`

## MCP Tools

- [ ] Criar tool `comunica-cnj-search` no repositório MCP
- [ ] Criar tool `comunica-cnj-capture` no repositório MCP
- [ ] Criar tool `comunica-cnj-certidao` no repositório MCP
- [ ] Documentar tools no README do MCP

## Testes e Validação

- [x] Testar migrações em ambiente de desenvolvimento
- [ ] Testar cliente HTTP com API real do CNJ
- [ ] Testar fluxo de captura e vinculação
- [ ] Validar criação automática de expediente
- [ ] Testar rate limiting e retry

## Atualização de Tipos Globais

- [ ] Gerar tipos TypeScript atualizados do Supabase
- [ ] Atualizar `lib/types/` com novos tipos

---

## Notas de Implementação

### Inferência de Grau

```typescript
function inferirGrau(nomeOrgao: string, siglaTribunal: string): GrauTribunal {
  const orgaoLower = nomeOrgao.toLowerCase();

  // TST/Tribunal Superior
  if (siglaTribunal === 'TST' || orgaoLower.includes('ministro')) {
    return 'tribunal_superior';
  }

  // Segundo grau
  if (orgaoLower.includes('turma') ||
      orgaoLower.includes('gabinete') ||
      orgaoLower.includes('segundo grau') ||
      orgaoLower.includes('sejusc segundo')) {
    return 'segundo_grau';
  }

  // Primeiro grau (default)
  // vara, comarca, fórum, etc.
  return 'primeiro_grau';
}
```

### Extração de Partes

```typescript
function extrairPartes(destinatarios: Destinatario[]): {
  poloAtivo: string[],
  poloPassivo: string[]
} {
  return {
    poloAtivo: destinatarios.filter(d => d.polo === 'A').map(d => d.nome),
    poloPassivo: destinatarios.filter(d => d.polo === 'P').map(d => d.nome)
  };
}
```

### Match Comunicação ↔ Expediente

```sql
SELECT * FROM expedientes
WHERE numero_processo = :numero_processo
  AND trt = :sigla_tribunal
  AND grau = :grau_inferido
  AND data_criacao_expediente
      BETWEEN :data_disponibilizacao - INTERVAL '3 days'
      AND :data_disponibilizacao
  AND NOT EXISTS (
    SELECT 1 FROM comunica_cnj
    WHERE comunica_cnj.expediente_id = expedientes.id
  )
ORDER BY data_criacao_expediente DESC
LIMIT 1;
```
