# Tasks: Geração de Peças Jurídicas

## 1. Database Schema

- [ ] 1.1 Criar tabela `pecas_modelos` com campos: id, titulo, descricao, conteudo (Plate.js JSON), tipo_peca (enum), entidade_vinculada (enum), placeholders_definidos (JSONB), categoria, visibilidade, criado_por, created_at, updated_at
- [ ] 1.2 Criar enum `tipo_peca`: peticao_inicial, contestacao, recurso_ordinario, agravo, embargos_declaracao, manifestacao, parecer, contrato
- [ ] 1.3 Criar enum `entidade_vinculada`: contrato, processo, cliente
- [ ] 1.4 Criar tabela `contrato_documentos` com campos: id, contrato_id (FK), documento_id (FK documentos), tipo_documento, gerado_de_modelo_id (FK pecas_modelos nullable), created_at
- [ ] 1.5 Criar índices para performance (contrato_id, documento_id, tipo_peca)
- [ ] 1.6 Criar RLS policies para pecas_modelos e contrato_documentos

## 2. Backend - Domain & Types

- [ ] 2.1 Criar `src/features/pecas-juridicas/domain.ts` com tipos TypeScript e schemas Zod
- [ ] 2.2 Definir interface `PecaModelo` com todos os campos
- [ ] 2.3 Definir interface `PlaceholderDefinicao` com estrutura: key, label, tipo, obrigatorio, formato
- [ ] 2.4 Definir interface `ContratoDocumento` para vínculo
- [ ] 2.5 Criar constantes de placeholders disponíveis por entidade (CLIENTE_PLACEHOLDERS, PARTE_CONTRARIA_PLACEHOLDERS, CONTRATO_PLACEHOLDERS)

## 3. Backend - Repository & Service

- [ ] 3.1 Criar `src/features/pecas-juridicas/repositories/modelos-repository.ts` com CRUD de modelos
- [ ] 3.2 Criar `src/features/pecas-juridicas/repositories/contrato-documentos-repository.ts` para vínculos
- [ ] 3.3 Criar `src/features/pecas-juridicas/service.ts` com lógica de negócio
- [ ] 3.4 Implementar `gerarPecaDeContrato(contratoId, modeloId)` - busca dados e substitui placeholders
- [ ] 3.5 Implementar `substituirPlaceholders(conteudo, dados)` - engine de substituição
- [ ] 3.6 Implementar validação de placeholders obrigatórios

## 4. Backend - Placeholder Engine

- [ ] 4.1 Criar `src/features/pecas-juridicas/utils/placeholder-engine.ts`
- [ ] 4.2 Implementar parser de placeholders no formato `{{entidade_indice.campo}}`
- [ ] 4.3 Implementar resolver de dados: buscar cliente, partes contrárias, endereços
- [ ] 4.4 Implementar formatadores específicos: CPF (XXX.XXX.XXX-XX), CNPJ, data por extenso, endereço completo
- [ ] 4.5 Implementar tratamento de placeholders não encontrados (manter ou remover)
- [ ] 4.6 Criar preview de placeholders disponíveis para um contrato

## 5. Backend - Server Actions

- [ ] 5.1 Criar `src/features/pecas-juridicas/actions/modelos-actions.ts`
- [ ] 5.2 Action: `criarModelo`, `atualizarModelo`, `deletarModelo`, `listarModelos`
- [ ] 5.3 Criar `src/features/pecas-juridicas/actions/geracao-actions.ts`
- [ ] 5.4 Action: `gerarPecaDeContrato(contratoId, modeloId)` - gera documento e vincula
- [ ] 5.5 Action: `listarDocumentosDoContrato(contratoId)` - lista peças vinculadas
- [ ] 5.6 Action: `previewPlaceholders(contratoId)` - retorna dados disponíveis para preview

## 6. Frontend - Modelos de Peças

- [ ] 6.1 Criar página `/app/documentos/modelos-pecas` para gestão de modelos
- [ ] 6.2 Criar componente `ModeloPecaForm` para criar/editar modelos
- [ ] 6.3 Integrar Plate.js editor para edição de conteúdo do modelo
- [ ] 6.4 Criar componente `PlaceholderInserter` - menu para inserir placeholders no editor
- [ ] 6.5 Criar componente `PlaceholderHighlight` - destaque visual de placeholders no editor
- [ ] 6.6 Criar listagem de modelos com filtro por tipo_peca e categoria

## 7. Frontend - Geração de Peças

- [ ] 7.1 Adicionar botão "Gerar Peça" na página de detalhes do contrato
- [ ] 7.2 Criar `GerarPecaDialog` - modal para selecionar modelo e gerar
- [ ] 7.3 Mostrar preview dos dados que serão substituídos antes de gerar
- [ ] 7.4 Após geração, redirecionar para editor do documento gerado
- [ ] 7.5 Criar aba/seção "Documentos" na visualização do contrato
- [ ] 7.6 Listar documentos vinculados ao contrato com ações (abrir, exportar, desvincular)

## 8. Frontend - Hooks

- [ ] 8.1 Criar `useModelosPecas` hook para listagem e CRUD de modelos
- [ ] 8.2 Criar `useGerarPeca` hook para geração com loading state
- [ ] 8.3 Criar `useContratoDocumentos` hook para listar documentos do contrato
- [ ] 8.4 Criar `usePlaceholdersPreview` hook para preview de dados disponíveis

## 9. Integração & Export

- [ ] 9.1 Garantir que documentos gerados usam exportação existente (DOCX/PDF)
- [ ] 9.2 Adicionar botão de exportação rápida na lista de documentos do contrato
- [ ] 9.3 Manter vínculo com modelo original para possível re-geração

## 10. Testes & Documentação

- [ ] 10.1 Criar testes unitários para placeholder-engine
- [ ] 10.2 Criar testes de integração para geração de peças
- [ ] 10.3 Documentar placeholders disponíveis em RULES.md do módulo
- [ ] 10.4 Atualizar spec com cenários finais
