# documentos-editor Specification

## Purpose
TBD - created by archiving change add-document-editor-system. Update Purpose after archive.
## Requirements
### Requirement: CRUD de Documentos (REQ-DOC-001)

O sistema DEVE (MUST) permitir criar, visualizar, editar e deletar documentos com editor de texto rico.

#### Scenario: Criar documento vazio
GIVEN o usuário está autenticado
WHEN o usuário clica em "Novo Documento"
THEN o sistema deve:
- Criar documento com título "Sem título"
- Conteúdo vazio (array JSON do Plate.js: `[]`)
- Associar ao usuário atual (`criado_por`)
- Redirecionar para página de edição

#### Scenario: Criar documento a partir de template
GIVEN o usuário está autenticado
AND existe um template disponível
WHEN o usuário seleciona "Usar Template"
THEN o sistema deve:
- Criar documento com conteúdo do template
- Incrementar `uso_count` do template
- Título padrão baseado no template
- Redirecionar para página de edição

#### Scenario: Visualizar documento
GIVEN o usuário tem acesso ao documento (criador ou compartilhado)
WHEN o usuário abre o documento
THEN o sistema deve:
- Carregar conteúdo completo do documento
- Renderizar no editor Plate.js
- Mostrar metadados (criador, última edição, versão)
- Habilitar auto-save automático

#### Scenario: Editar documento
GIVEN o usuário tem permissão de edição
WHEN o usuário altera o conteúdo
THEN o sistema deve:
- Auto-salvar após 2 segundos de inatividade
- Mostrar indicador visual (salvando/salvo)
- Atualizar `updated_at` e `editado_por`
- NÃO incrementar versão (apenas auto-save)

#### Scenario: Salvar versão explicitamente
GIVEN o usuário editou o documento
WHEN o usuário clica em "Salvar" (Ctrl+S)
THEN o sistema deve:
- Salvar versão anterior em `documentos_versoes`
- Incrementar campo `versao`
- Atualizar `editado_em` e `editado_por`
- Mostrar toast "Versão X salva"

#### Scenario: Deletar documento (soft delete)
GIVEN o usuário é o criador
WHEN o usuário clica em "Deletar"
AND confirma a ação
THEN o sistema deve:
- Setar `deleted_at` com timestamp atual
- Mover documento para lixeira
- Remover da lista principal
- Mostrar toast "Documento movido para lixeira"

---

### Requirement: Sistema de Pastas Hierárquico (REQ-DOC-002)

O sistema DEVE (MUST) permitir organização de documentos em pastas com hierarquia ilimitada.

#### Scenario: Criar pasta comum
GIVEN o usuário está autenticado
WHEN o usuário clica em "Nova Pasta"
AND seleciona tipo "comum"
AND informa nome da pasta
THEN o sistema deve:
- Criar pasta com tipo "comum"
- Associar ao usuário criador
- Tornar visível para todos os usuários
- Adicionar à árvore de pastas

#### Scenario: Criar pasta privada
GIVEN o usuário está autenticado
WHEN o usuário cria pasta tipo "privada"
THEN o sistema deve:
- Criar pasta visível apenas para o criador
- Outros usuários NÃO veem a pasta
- Pode conter documentos privados

#### Scenario: Criar subpasta
GIVEN existe uma pasta pai
WHEN o usuário cria pasta dentro de outra
THEN o sistema deve:
- Validar que não há ciclo (pasta não pode ser pai de si mesma)
- Setar `pasta_pai_id` corretamente
- Limitar profundidade máxima a 10 níveis
- Mostrar hierarquia visualmente na árvore

#### Scenario: Mover documento para pasta
GIVEN o usuário tem permissão de edição no documento
WHEN o usuário arrasta documento para pasta
THEN o sistema deve:
- Atualizar `pasta_id` do documento
- Validar que usuário tem acesso à pasta destino
- Atualizar visualização imediatamente

#### Scenario: Deletar pasta (soft delete)
GIVEN o usuário é criador da pasta
WHEN o usuário deleta pasta
THEN o sistema deve:
- Apresentar opção: "Mover documentos para raiz" ou "Deletar documentos"
- Setar `deleted_at` na pasta
- Processar documentos filhos conforme escolha
- Mover para lixeira

---

### Requirement: Compartilhamento User-to-User (REQ-DOC-003)

O sistema DEVE (MUST) permitir compartilhamento de documentos com permissões configuráveis.

#### Scenario: Compartilhar documento com permissão "visualizar"
GIVEN o usuário é criador do documento
WHEN o usuário compartilha com outro usuário
AND seleciona permissão "visualizar"
THEN o sistema deve:
- Criar registro em `documentos_compartilhados`
- Usuário destinatário pode abrir e ler o documento
- Usuário destinatário NÃO pode editar
- Usuário destinatário NÃO pode deletar

#### Scenario: Compartilhar documento com permissão "editar"
GIVEN o usuário é criador do documento
WHEN o usuário compartilha com permissão "editar"
THEN o sistema deve:
- Usuário destinatário pode editar conteúdo
- Usuário destinatário NÃO pode deletar
- Edições rastreadas em `editado_por`

#### Scenario: Alterar permissão de compartilhamento
GIVEN documento já está compartilhado
WHEN criador altera permissão de "visualizar" para "editar"
THEN o sistema deve:
- Atualizar `permissao` em `documentos_compartilhados`
- Refletir mudança imediatamente
- Notificar usuário destinatário

#### Scenario: Remover compartilhamento
GIVEN documento está compartilhado
WHEN criador remove compartilhamento
THEN o sistema deve:
- Deletar registro de `documentos_compartilhados`
- Usuário destinatário perde acesso imediatamente
- Mostrar toast de confirmação

---

### Requirement: Templates Reutilizáveis (REQ-DOC-004)

O sistema DEVE (MUST) fornecer biblioteca de templates para criação rápida de documentos.

#### Scenario: Criar template público
GIVEN o usuário está autenticado
WHEN o usuário cria template com visibilidade "publico"
THEN o sistema deve:
- Salvar template em `templates`
- Tornar visível para todos os usuários
- Permitir categorização (ex: "Petições", "Atas")
- Mostrar na biblioteca de templates

#### Scenario: Criar template privado
GIVEN o usuário cria template com visibilidade "privado"
THEN o sistema deve:
- Template visível apenas para o criador
- NÃO aparecer para outros usuários
- Pode ser convertido para público depois

#### Scenario: Usar template
GIVEN existe template disponível
WHEN usuário clica em "Usar Template"
THEN o sistema deve:
- Criar novo documento com conteúdo do template
- Incrementar `uso_count` do template
- Usuário pode editar livremente (não vincula ao template)

#### Scenario: Buscar templates por categoria
GIVEN existem templates categorizados
WHEN usuário filtra por categoria "Petições"
THEN o sistema deve:
- Mostrar apenas templates da categoria selecionada
- Ordenar por popularidade (`uso_count` desc)

---

### Requirement: Upload para Backblaze B2 (REQ-DOC-005)

O sistema DEVE (MUST) permitir upload de arquivos (imagens, vídeos, áudio, PDFs) para Backblaze B2.

#### Scenario: Upload de imagem no editor
GIVEN o usuário está editando documento
WHEN o usuário cola ou arrasta imagem
THEN o sistema deve:
- Validar tipo MIME (jpeg, png, gif, webp, svg)
- Validar tamanho máximo (50 MB)
- Fazer upload para B2 com chave `editor/doc_{id}/{timestamp}_{random}.{ext}`
- Registrar em `documentos_uploads`
- Inserir URL da imagem no editor

#### Scenario: Upload de arquivo PDF
GIVEN o usuário insere PDF no documento
WHEN o usuário seleciona arquivo PDF
THEN o sistema deve:
- Validar tipo MIME (application/pdf)
- Fazer upload para B2
- Criar link clicável no documento
- Permitir visualização inline (se possível)

#### Scenario: Falha no upload
GIVEN o upload para B2 falha
WHEN erro de conexão ou timeout
THEN o sistema deve:
- Mostrar mensagem de erro clara
- Oferecer botão "Tentar Novamente"
- NÃO inserir conteúdo no editor
- Logar erro para debug

#### Scenario: Deletar arquivo do documento
GIVEN documento possui arquivo anexado
WHEN usuário remove arquivo do editor
THEN o sistema deve:
- Deletar arquivo do Backblaze B2
- Remover registro de `documentos_uploads`
- Liberar espaço de armazenamento

---

### Requirement: Versionamento com Histórico (REQ-DOC-006)

O sistema DEVE (MUST) manter histórico completo de versões de documentos.

#### Scenario: Salvar nova versão
GIVEN documento foi editado
WHEN usuário salva explicitamente (Ctrl+S)
THEN o sistema deve:
- Antes de atualizar, salvar versão atual em `documentos_versoes`
- Incrementar campo `versao` em `documentos`
- Manter snapshot completo (conteúdo + título)
- Registrar quem criou a versão

#### Scenario: Visualizar histórico de versões
GIVEN documento possui múltiplas versões
WHEN usuário clica em "Ver Histórico"
THEN o sistema deve:
- Listar todas as versões em ordem decrescente
- Mostrar: número da versão, data, quem editou
- Permitir visualização de cada versão (read-only)

#### Scenario: Restaurar versão anterior
GIVEN usuário está visualizando versão antiga
WHEN usuário clica em "Restaurar Esta Versão"
THEN o sistema deve:
- Criar NOVA versão com conteúdo da versão antiga
- Incrementar campo `versao`
- Preservar histórico completo (não deletar versões)
- Mostrar toast "Versão X restaurada"

---

### Requirement: Soft Delete com Lixeira (REQ-DOC-007)

O sistema DEVE (MUST) permitir recuperação de documentos e pastas deletados.

#### Scenario: Visualizar lixeira
GIVEN usuário deletou documentos
WHEN usuário acessa "Lixeira"
THEN o sistema deve:
- Mostrar todos os itens com `deleted_at` não nulo
- Filtrar por tipo (documentos, pastas)
- Ordenar por `deleted_at` desc (mais recentes primeiro)
- Mostrar quantos dias restam para deleção permanente

#### Scenario: Restaurar documento da lixeira
GIVEN documento está na lixeira
WHEN usuário clica em "Restaurar"
THEN o sistema deve:
- Setar `deleted_at = null`
- Retornar documento à lista principal
- Manter pasta original (se ainda existir)
- Mostrar toast "Documento restaurado"

#### Scenario: Deletar permanentemente
GIVEN documento está na lixeira há 30 dias
WHEN job de limpeza executa
THEN o sistema deve:
- Hard delete do banco (remover registro)
- Deletar todos os uploads associados do B2
- Deletar todas as versões associadas
- Processo irreversível

#### Scenario: Restaurar pasta com documentos
GIVEN pasta deletada contém documentos
WHEN usuário restaura pasta
THEN o sistema deve:
- Restaurar pasta (`deleted_at = null`)
- Restaurar todos os documentos filhos
- Manter hierarquia completa

---

### Requirement: Colaboração em Tempo Real (REQ-DOC-008)

O sistema DEVE (MUST) permitir múltiplos usuários editando o mesmo documento simultaneamente.

#### Scenario: Ver usuários online no documento
GIVEN múltiplos usuários abrem o mesmo documento
WHEN usuário A abre documento
THEN o sistema deve:
- Mostrar avatares de outros usuários online
- Usar componente `RealtimeAvatarStack`
- Atualizar lista em tempo real (Supabase Realtime Presence)

#### Scenario: Ver cursores de outros usuários
GIVEN usuários editando simultaneamente
WHEN usuário A move cursor
THEN o sistema deve:
- Broadcast posição do cursor via Realtime
- Mostrar cursor do usuário A para usuário B
- Incluir nome do usuário próximo ao cursor
- Usar componente `RealtimeCursors`

#### Scenario: Sincronização de alterações
GIVEN usuário A edita parágrafo X
WHEN usuário A digita texto
THEN o sistema deve:
- Debounce de 500ms
- Broadcast alterações via Realtime
- Usuário B recebe alterações automaticamente
- Aplicar merge inteligente (Last-Write-Wins)

#### Scenario: Conflito de edição
GIVEN usuários A e B editam mesma linha
WHEN ambos salvam simultaneamente
THEN o sistema deve:
- Aplicar estratégia Last-Write-Wins
- Última edição sobrescreve anterior
- Mostrar notificação "Outro usuário também está editando"

---

### Requirement: Auto-Save (REQ-DOC-009)

O sistema DEVE (MUST) salvar alterações automaticamente sem bloquear o usuário.

#### Scenario: Auto-save após inatividade
GIVEN usuário está editando documento
WHEN usuário para de digitar por 2 segundos
THEN o sistema deve:
- Enviar requisição para `/api/documentos/[id]/auto-save`
- Mostrar indicador "Salvando..."
- Após sucesso, mostrar "Salvo [hora]"
- NÃO incrementar versão
- NÃO criar entrada em `documentos_versoes`

#### Scenario: Falha no auto-save
GIVEN auto-save está executando
WHEN API retorna erro (rede, timeout, etc)
THEN o sistema deve:
- Mostrar toast de erro
- Tentar novamente após 5 segundos (retry)
- Máximo de 3 tentativas
- Alertar usuário se persistir falha

#### Scenario: Auto-save durante colaboração
GIVEN múltiplos usuários editando
WHEN auto-save de usuário A executa
THEN o sistema deve:
- Salvar alterações do usuário A
- NÃO sobrescrever alterações de usuário B
- Manter sincronização via Realtime

---

### Requirement: Exportação PDF/DOCX (REQ-DOC-010)

O sistema DEVE (MUST) permitir exportação de documentos para PDF e DOCX.

#### Scenario: Exportar para DOCX
GIVEN documento possui conteúdo formatado
WHEN usuário clica em "Exportar DOCX"
THEN o sistema deve:
- Converter conteúdo Plate.js para DOCX usando `@platejs/docx`
- Preservar formatação (negrito, itálico, listas, tabelas)
- Download automático do arquivo
- Nome: `{titulo}_v{versao}.docx`

#### Scenario: Exportar para PDF
GIVEN documento possui imagens e formatação
WHEN usuário clica em "Exportar PDF"
THEN o sistema deve:
- Converter Plate.js → HTML → PDF (Puppeteer)
- Preservar layout e imagens
- Configurar página A4, margens 20mm
- Download automático do arquivo
- Nome: `{titulo}_v{versao}.pdf`

#### Scenario: Falha na exportação
GIVEN exportação para PDF falha
WHEN erro de renderização ou timeout
THEN o sistema deve:
- Mostrar mensagem de erro clara
- Oferecer exportação alternativa (DOCX)
- Logar erro para debug

---

### Requirement: Integração com IA (Open Router) (REQ-DOC-011)

O sistema DEVE (MUST) integrar IA para assistência na escrita usando Open Router.

#### Scenario: Configurar API Key
GIVEN administrador tem chave Open Router
WHEN administrador adiciona `OPENROUTER_API_KEY` no `.env`
THEN o sistema deve:
- Habilitar funcionalidades de IA no editor
- Validar chave na inicialização
- Logar erro se chave inválida

#### Scenario: Usar IA para completar texto
GIVEN editor possui conteúdo
WHEN usuário seleciona texto e clica "Completar com IA"
THEN o sistema deve:
- Enviar contexto para Open Router API
- Receber sugestão de completação
- Inserir sugestão no editor (aceitar/rejeitar)
- Usar model configurável (ex: GPT-4, Claude)

#### Scenario: Remover settings do Plate.js
GIVEN editor Plate.js tem componente de settings no canto inferior direito
WHEN editor é renderizado
THEN o sistema deve:
- Suprimir componente de settings original
- Configurar IA via variáveis de ambiente (não UI)
- Manter apenas funcionalidades essenciais do editor

---

### Requirement: Command Menu (Command K) (REQ-DOC-012)

O sistema DEVE (MUST) fornecer Command Menu para acesso rápido a ações.

#### Scenario: Abrir Command Menu
GIVEN usuário está em qualquer página
WHEN usuário pressiona Cmd+K (Mac) ou Ctrl+K (Windows)
THEN o sistema deve:
- Abrir dialog com campo de busca
- Mostrar ações disponíveis
- Permitir navegação por teclado

#### Scenario: Buscar documentos
GIVEN Command Menu está aberto
WHEN usuário digita nome do documento
THEN o sistema deve:
- Buscar documentos em tempo real (debounce 300ms)
- Mostrar resultados com preview
- Ao clicar, abrir documento

#### Scenario: Criar documento via Command
GIVEN Command Menu está aberto
WHEN usuário digita "Novo Documento"
THEN o sistema deve:
- Mostrar ação "Criar Novo Documento"
- Ao pressionar Enter, criar documento
- Redirecionar para editor

#### Scenario: Acessar templates
GIVEN existem templates disponíveis
WHEN usuário digita "Template"
THEN o sistema deve:
- Mostrar lista de templates
- Ao selecionar, criar documento a partir do template

---

### Requirement: Wrapper do Plate.js (Não Modificar Componentes Originais) (REQ-DOC-013)

O sistema DEVE (MUST) criar wrappers customizados sem modificar componentes baseline do Plate.js.

#### Scenario: Criar wrapper do PlateEditor
GIVEN Plate.js fornece `<PlateEditor />`
WHEN implementar funcionalidades customizadas
THEN o sistema deve:
- Criar `<DocumentEditorWrapper />` que envolve `<PlateEditor />`
- NÃO modificar arquivos em `components/plate/` diretamente
- Adicionar auto-save, colaboração, upload no wrapper
- Manter componentes Plate.js inalterados

#### Scenario: Customizar toolbar
GIVEN Plate.js tem toolbar padrão
WHEN adicionar botões customizados
THEN o sistema deve:
- Criar componente `<CustomToolbar />` separado
- Adicionar botões: Exportar, Compartilhar, Versões
- Renderizar junto com toolbar original
- NÃO modificar `components/plate/toolbar-*`

#### Scenario: Suprimir componente de settings
GIVEN Plate.js renderiza settings no canto inferior direito
WHEN renderizar editor
THEN o sistema deve:
- Usar CSS para esconder componente de settings
- Ou passar prop `showSettings={false}` (se disponível)
- Configurar IA via env vars (não UI)

---

