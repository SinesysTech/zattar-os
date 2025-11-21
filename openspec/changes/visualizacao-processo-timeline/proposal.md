# Visualização de Processo com Timeline Completa

**Change ID**: `visualizacao-processo-timeline`
**Status**: Proposal
**Created**: 2025-01-21
**Author**: Claude

## Contexto

Atualmente, a página de listagem de processos (`app/(dashboard)/processos/page.tsx`) possui um botão "Visualizar" (ícone Eye) que não está implementado. Ao ser clicado, apenas faz um `console.log` do ID do processo.

Já existem no backend:
- Endpoint de captura de timeline: `POST /api/captura/trt/timeline`
- Endpoint de consulta: `GET /api/acervo/[id]/timeline`
- Integração com MongoDB para armazenar timeline
- Upload automático de documentos para Google Drive via webhook n8n
- Persistência da referência `timeline_mongodb_id` no PostgreSQL

## Objetivo

Implementar a visualização completa de um processo com sua timeline de movimentações e documentos, incluindo:

1. **Verificação de timeline existente** ao clicar em "Visualizar"
2. **Captura automática** caso a timeline não exista no MongoDB
3. **Upload de documentos** para Google Drive durante a captura
4. **Página de visualização** rica exibindo timeline, documentos e metadados do processo

## Benefícios

- **Experiência do usuário melhorada**: Visualização rica e contextualizada dos processos
- **Automação inteligente**: Captura sob demanda apenas quando necessário
- **Acesso a documentos**: Links diretos para Google Drive
- **Redução de trabalho manual**: Não requer ir ao PJE para ver histórico completo

## Escopo

### Incluído

- Hook para verificação e captura de timeline (`useProcessoTimeline`)
- Integração com endpoints existentes de captura e consulta
- Página de visualização de processo em rota dinâmica `app/(dashboard)/processos/[id]/page.tsx`
- Componentes de UI para timeline, documentos e metadados
- Estados de loading, erro e vazio
- Atualização do botão "Visualizar" para navegação

### Não Incluído

- Alterações nos endpoints de captura existentes (já funcionais)
- Modificações na estrutura de dados MongoDB (já definida)
- Edição de dados do processo (apenas visualização)
- Re-captura manual forçada (fica para futura iteração)

## Capacidades Especificadas

1. **verificacao-timeline-existente**: Verificar se timeline existe antes de iniciar captura
2. **captura-timeline-automatica**: Acionar captura automaticamente se necessário
3. **pagina-visualizacao-processo**: Interface completa de visualização

## Dependências

- **Técnicas**: Endpoints `GET /api/acervo/[id]/timeline` e `POST /api/captura/trt/timeline` operacionais
- **Infraestrutura**: MongoDB configurado, Google Drive webhook n8n funcionando
- **Dados**: Processos devem ter `trt`, `grau`, `id_pje` e `advogado_id` preenchidos

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Captura pode demorar minutos | Loading state claro + possibilidade de navegar durante captura |
| Erro de autenticação no PJE | Mensagem de erro clara + orientação para verificar credenciais |
| Webhook Google Drive indisponível | Mostrar timeline mesmo sem links de documentos |
| MongoDB indisponível | Fallback com mensagem de erro + retry button |

## Validação de Sucesso

- [ ] Ao clicar em "Visualizar", usuário é redirecionado para página do processo
- [ ] Se timeline não existe, captura é iniciada automaticamente
- [ ] Timeline é exibida com movimentos e documentos ordenados cronologicamente
- [ ] Links do Google Drive estão funcionais e acessíveis
- [ ] Dados do processo (partes, tribunal, etc.) são exibidos corretamente
- [ ] Estados de loading, erro e vazio são exibidos apropriadamente

## Referências

- [Página de Processos Atual](../../app/(dashboard)/processos/page.tsx)
- [Endpoint Captura Timeline](../../app/api/captura/trt/timeline/route.ts)
- [Endpoint Consulta Timeline](../../app/api/acervo/[id]/timeline/route.ts)
- [Serviço Timeline Persistence](../../backend/captura/services/timeline/timeline-persistence.service.ts)
