# Tasks: Adicionar Interface de Captura de Timeline

## 1. Atualizar Tipos e Seleção de Captura
- [x] 1.1 Adicionar tipo 'timeline' ao enum `TipoCaptura` em `tipo-captura-select.tsx`
- [x] 1.2 Adicionar entrada para timeline no array `tiposCaptura` com ícone FileText
- [x] 1.3 Definir label "Timeline do Processo" e description apropriada

## 2. Criar Cliente API para Timeline
- [x] 2.1 Adicionar interface `CapturaTimelineRequest` em `lib/api/captura.ts`
- [x] 2.2 Implementar função `capturarTimeline()` que chama POST `/api/captura/trt/timeline`
- [x] 2.3 Adicionar tipos de resposta baseados em `CapturaTimelineResult`
- [x] 2.4 Implementar tratamento de erros apropriado

## 3. Criar Componente TimelineForm
- [x] 3.1 Criar arquivo `app/(dashboard)/captura/components/timeline-form.tsx`
- [x] 3.2 Implementar estrutura base usando `CapturaFormBase`
- [x] 3.3 Adicionar campo de input para número do processo (com formatação)
- [x] 3.4 Adicionar checkbox "Baixar Documentos" (default: true)
- [x] 3.5 Criar seção collapsible "Filtros Avançados" com:
  - Checkbox "Apenas Assinados" (default: true)
  - Checkbox "Apenas Não Sigilosos" (default: true)
  - Input de texto para tipos de documento separados por vírgula (opcional)
  - Date picker para data inicial (opcional)
  - Date picker para data final (opcional)
- [x] 3.6 Implementar lógica de validação (advogado, credenciais, número processo)
- [x] 3.7 Implementar handler de captura usando `capturarTimeline()`
- [x] 3.8 Adicionar `CapturaButton` e `CapturaResult` para feedback
- [x] 3.9 Adicionar states para loading e resultado

## 4. Integrar Timeline no Dialog de Captura
- [x] 4.1 Importar `TimelineForm` em `captura-dialog.tsx`
- [x] 4.2 Adicionar case 'timeline' no switch do `renderForm()`
- [x] 4.3 Testar que o dialog renderiza corretamente o novo formulário

## 5. Validação e Testes
- [x] 5.1 Verificar type checking dos arquivos modificados (sem erros)
- [ ] 5.2 Testar preenchimento e validação de todos os campos (requer ambiente de dev)
- [ ] 5.3 Testar captura com diferentes combinações de filtros (requer ambiente de dev)
- [ ] 5.4 Testar tratamento de erros (processo não encontrado, credenciais inválidas) (requer ambiente de dev)
- [ ] 5.5 Verificar feedback visual (loading, sucesso, erro) (requer ambiente de dev)
- [ ] 5.6 Validar que resultado mostra informações relevantes (totalItens, totalDocumentos, mongoId) (requer ambiente de dev)

## 6. Documentação
- [x] 6.1 Adicionar comentários JSDoc no componente TimelineForm
- [x] 6.2 Documentar parâmetros da função `capturarTimeline()`
- [x] 6.3 Adicionar exemplo de uso no comentário do componente

## Notas de Implementação

### TODO: Buscar TRT e Grau da Credencial
O componente `TimelineForm` atualmente usa valores hardcoded (`TRT3`, `primeiro_grau`) para os parâmetros da API. Isso deve ser substituído por uma chamada que busque os detalhes da credencial selecionada para extrair `trtCodigo` e `grau`.

Sugestões:
1. Criar hook `useCredencialDetalhes(credencialId)` que retorna `{ trtCodigo, grau }`
2. Ou adicionar endpoint GET `/api/credenciais/[id]` que retorna os detalhes
3. Ou incluir `trtCodigo` e `grau` no retorno de `useCredenciais()`

### Diferenças em Relação aos Outros Formulários
- **Outros formulários** (acervo geral, arquivados, audiências, pendentes) aceitam múltiplas credenciais e fazem captura em lote
- **Timeline** captura um **processo específico**, então tecnicamente precisa apenas de uma credencial (para obter TRT/grau)
- Mantivemos o padrão de múltiplas credenciais no `CapturaFormBase` por consistência, mas usamos apenas a primeira

### Melhorias Futuras
- Adicionar validação de formato do número do processo
- Implementar multi-select de tipos de documento (em vez de input text separado por vírgula)
- Adicionar preview dos filtros aplicados antes de submeter
- Mostrar credencial selecionada com TRT/grau para confirmação visual
