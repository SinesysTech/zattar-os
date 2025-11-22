# Spec: Permissões Granulares

## ADDED Requirements

### Requirement: Matriz de Permissões Disponíveis
O sistema SHALL fornecer uma matriz completa de todos os recursos e operações disponíveis no sistema.

#### Scenario: Listar todos os recursos e operações
- **WHEN** usuário autenticado envia GET para `/api/permissoes/recursos`
- **THEN** sistema retorna objeto estruturado com 13 recursos (advogados, credenciais, acervo, audiencias, pendentes, usuarios, clientes, partes_contrarias, contratos, agendamentos, captura, tipos_expedientes, cargos) e suas respectivas operações (~81 permissões no total)

#### Scenario: Estrutura da matriz
- **WHEN** consultando matriz de permissões
- **THEN** resposta tem formato `{ "recurso": ["operacao1", "operacao2", ...] }`

### Requirement: Atribuição de Permissões a Usuários
O sistema SHALL permitir atribuir múltiplas permissões a um usuário de forma batch.

#### Scenario: Atribuir permissões em lote
- **WHEN** usuário autenticado envia POST para `/api/permissoes/usuarios/5` com `[{ "recurso": "contratos", "operacao": "criar" }, { "recurso": "contratos", "operacao": "editar" }]`
- **THEN** sistema cria 2 registros na tabela `permissoes` e retorna lista de permissões atribuídas

#### Scenario: Atribuir permissão duplicada (upsert)
- **WHEN** usuário tenta atribuir permissão que já existe
- **THEN** sistema atualiza registro existente (upsert) e retorna sucesso

#### Scenario: Atribuir permissão inválida
- **WHEN** usuário tenta atribuir permissão com recurso ou operação não existente na matriz
- **THEN** sistema retorna erro 400 "Recurso ou operação inválida"

### Requirement: Listagem de Permissões de um Usuário
O sistema SHALL permitir listar todas as permissões de um usuário específico.

#### Scenario: Listar permissões de usuário normal
- **WHEN** usuário autenticado envia GET para `/api/permissoes/usuarios/5`
- **THEN** sistema retorna array de permissões `[{ "recurso": "contratos", "operacao": "criar", "permitido": true }, ...]`

#### Scenario: Listar permissões de super admin
- **WHEN** consultando permissões de usuário com `is_super_admin = true`
- **THEN** sistema retorna matriz completa de todas as permissões (81 permissões com `permitido = true`)

#### Scenario: Usuário sem permissões
- **WHEN** usuário não possui nenhuma permissão atribuída
- **THEN** sistema retorna array vazio `[]`

### Requirement: Atualização Completa de Permissões
O sistema SHALL permitir substituir todas as permissões de um usuário de uma vez.

#### Scenario: Substituir permissões
- **WHEN** usuário autenticado envia PUT para `/api/permissoes/usuarios/5` com nova lista de permissões
- **THEN** sistema deleta todas as permissões existentes do usuário e insere novas permissões em transação

#### Scenario: Remover todas as permissões
- **WHEN** usuário envia PUT com array vazio `[]`
- **THEN** sistema remove todas as permissões do usuário

### Requirement: Revogação de Permissão Específica
O sistema SHALL permitir revogar uma permissão individual de um usuário.

#### Scenario: Revogar permissão existente
- **WHEN** usuário autenticado envia DELETE para `/api/permissoes/usuarios/5/contratos/criar`
- **THEN** sistema deleta registro da permissão e retorna sucesso

#### Scenario: Revogar permissão inexistente
- **WHEN** usuário tenta revogar permissão que não existe
- **THEN** sistema retorna erro 404 "Permissão não encontrada"

### Requirement: Verificação de Permissão
O sistema SHALL fornecer função helper para verificar se um usuário tem permissão para executar uma operação.

#### Scenario: Verificar permissão de usuário normal com permissão
- **WHEN** chamando `checkPermission(usuarioId: 5, recurso: "contratos", operacao: "criar")` e usuário possui essa permissão
- **THEN** função retorna `true`

#### Scenario: Verificar permissão de usuário normal sem permissão
- **WHEN** chamando `checkPermission(usuarioId: 5, recurso: "contratos", operacao: "deletar")` e usuário NÃO possui essa permissão
- **THEN** função retorna `false`

#### Scenario: Verificar permissão de super admin
- **WHEN** chamando `checkPermission` para usuário com `is_super_admin = true`
- **THEN** função retorna `true` sem consultar tabela de permissões (bypass total)

### Requirement: Super Admin Bypass
O sistema SHALL permitir que usuários com `is_super_admin = true` bypassem todas as verificações de permissão.

#### Scenario: Super admin acessa qualquer recurso
- **WHEN** usuário com `is_super_admin = true` tenta acessar qualquer recurso/operação
- **THEN** sistema concede acesso sem verificar tabela `permissoes`

#### Scenario: Listar permissões de super admin mostra tudo
- **WHEN** consultando permissões de super admin
- **THEN** sistema retorna matriz completa (todas as 81 permissões)

### Requirement: Middleware de Autorização
O sistema SHALL fornecer middleware para proteger rotas API com verificação de permissões.

#### Scenario: Acesso autorizado
- **WHEN** usuário com permissão `contratos.criar` envia POST para `/api/contratos`
- **THEN** middleware permite acesso e continua para handler da rota

#### Scenario: Acesso negado
- **WHEN** usuário sem permissão `contratos.deletar` envia DELETE para `/api/contratos/1`
- **THEN** middleware retorna erro 403 "Forbidden"

#### Scenario: Usuário não autenticado
- **WHEN** requisição sem token de autenticação tenta acessar rota protegida
- **THEN** middleware retorna erro 401 "Unauthorized" antes de verificar permissões

### Requirement: Auditoria de Alterações de Permissões
O sistema SHALL registrar em log todas as alterações de permissões (atribuição, revogação, atualização).

#### Scenario: Log ao atribuir permissão
- **WHEN** admin atribui permissão `contratos.criar` ao usuário ID 5
- **THEN** sistema registra evento em `logs_alteracao` com tipo_entidade="usuarios", entidade_id=5, tipo_evento="permissao_atribuida"

#### Scenario: Log ao revogar permissão
- **WHEN** admin revoga permissão do usuário
- **THEN** sistema registra evento "permissao_revogada" em log de auditoria

### Requirement: Validação de Recursos e Operações
O sistema SHALL validar que recursos e operações fornecidos existem na matriz de permissões.

#### Scenario: Recurso inválido
- **WHEN** tentando atribuir permissão com recurso "xyz_invalido"
- **THEN** sistema retorna erro 400 "Recurso 'xyz_invalido' não existe na matriz de permissões"

#### Scenario: Operação inválida para recurso
- **WHEN** tentando atribuir permissão "contratos.xyz_operacao"
- **THEN** sistema retorna erro 400 "Operação 'xyz_operacao' não existe para recurso 'contratos'"

### Requirement: Cache de Permissões
O sistema SHALL implementar cache in-memory para verificações de permissões com TTL de 5 minutos.

#### Scenario: Cache hit
- **WHEN** verificando permissão já consultada nos últimos 5 minutos
- **THEN** sistema retorna resultado do cache sem consultar banco

#### Scenario: Cache miss
- **WHEN** verificando permissão pela primeira vez ou após 5 minutos
- **THEN** sistema consulta banco, armazena resultado no cache e retorna

#### Scenario: Invalidação de cache ao alterar permissões
- **WHEN** permissões de um usuário são alteradas (atribuir/revogar)
- **THEN** sistema invalida cache para aquele usuário

### Requirement: Estrutura da Tabela de Permissões
O sistema SHALL armazenar permissões em tabela com constraint UNIQUE para evitar duplicatas.

#### Scenario: Constraint UNIQUE
- **WHEN** tentando inserir permissão duplicada (mesmo usuario_id, recurso, operacao)
- **THEN** banco de dados rejeita inserção ou faz upsert

#### Scenario: Índice composto
- **WHEN** consultando permissão específica
- **THEN** query usa índice `(usuario_id, recurso, operacao)` para performance otimizada

### Requirement: Cascade Delete ao Deletar Usuário
O sistema SHALL deletar automaticamente todas as permissões quando um usuário for deletado.

#### Scenario: Deletar usuário com permissões
- **WHEN** usuário com 20 permissões atribuídas é deletado
- **THEN** sistema remove automaticamente todas as 20 permissões via `ON DELETE CASCADE`

### Requirement: Row Level Security (RLS)
O sistema SHALL habilitar RLS na tabela `permissoes` com políticas de segurança.

#### Scenario: Usuário pode ler suas próprias permissões
- **WHEN** usuário autenticado consulta suas permissões
- **THEN** RLS permite leitura apenas de registros onde `usuario_id` corresponde ao usuário autenticado

#### Scenario: Admin pode gerenciar permissões de qualquer usuário
- **WHEN** usuário autenticado com permissão `usuarios.gerenciar_permissoes` consulta/modifica permissões
- **THEN** RLS permite operação (verificação adicional no backend)

### Requirement: Mapeamento Completo de Recursos e Operações
O sistema SHALL mapear todas as operações existentes dos 13 domínios.

#### Scenario: Recursos mapeados
- **WHEN** consultando matriz de permissões
- **THEN** matriz inclui 13 recursos: advogados, credenciais, acervo, audiencias, pendentes, usuarios, clientes, partes_contrarias, contratos, agendamentos, captura, tipos_expedientes, cargos

#### Scenario: Total de permissões
- **WHEN** contando todas as operações de todos os recursos
- **THEN** total é 81 permissões granulares

#### Scenario: Operações por recurso - Advogados
- **WHEN** consultando operações do recurso "advogados"
- **THEN** operações incluem: listar, visualizar, criar, editar, deletar

#### Scenario: Operações por recurso - Audiências
- **WHEN** consultando operações do recurso "audiencias"
- **THEN** operações incluem: listar, visualizar, editar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel, editar_url_virtual

#### Scenario: Operações por recurso - Pendentes
- **WHEN** consultando operações do recurso "pendentes"
- **THEN** operações incluem: listar, visualizar, atribuir_responsavel, desatribuir_responsavel, transferir_responsavel, baixar_expediente, reverter_baixa, editar_tipo_descricao

#### Scenario: Operações por recurso - Captura
- **WHEN** consultando operações do recurso "captura"
- **THEN** operações incluem: executar_acervo_geral, executar_arquivados, executar_audiencias, executar_pendentes, visualizar_historico, gerenciar_credenciais

### Requirement: Nomenclatura de Recursos e Operações
O sistema SHALL usar snake_case para nomes de recursos e operações.

#### Scenario: Formato snake_case
- **WHEN** consultando matriz de permissões
- **THEN** todos os nomes usam snake_case (ex: "pendentes", "atribuir_responsavel", "editar_url_virtual")
