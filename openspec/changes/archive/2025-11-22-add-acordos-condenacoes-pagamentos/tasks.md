# Tasks: Sistema de Acordos, Condenações e Pagamentos

## Database Layer (Priority: 1 - Foundation)

### 1. Criar migration para tabela `acordos_condenacoes`
- Criar arquivo de migration
- Definir schema completo com todos os campos
- Adicionar constraints e checks
- Adicionar comentários em PT-BR
- Criar índices de performance
- Habilitar RLS e criar políticas
- Criar trigger para updated_at
- **Validação:** `supabase db diff` sem erros, tabela criada

### 2. Criar migration para tabela `parcelas`
- Criar arquivo de migration
- Definir schema completo com todos os campos
- Adicionar constraints e checks
- Adicionar FK para acordos_condenacoes
- Adicionar comentários em PT-BR
- Criar índices de performance
- Habilitar RLS e criar políticas
- Criar trigger para updated_at
- **Validação:** `supabase db diff` sem erros, tabela criada com FK

### 3. Criar triggers de cálculo automático
- Trigger para atualizar status do acordo baseado nas parcelas
- Trigger para marcar parcela como atrasada (quando vencimento passa)
- Trigger para calcular honorarios_contratuais automaticamente
- Trigger para calcular valor_repasse_cliente automaticamente
- **Validação:** Triggers funcionam ao inserir/atualizar dados

### 4. Criar view `repasses_pendentes`
- Definir query da view
- Filtrar por status_repasse corretos
- JOIN com acordos_condenacoes
- Ordenação por status e data
- **Validação:** View retorna dados corretos quando testada

## Backend Services - Persistence Layer (Priority: 2)

### 5. Criar `acordo-condenacao-persistence.service.ts`
- Interface de tipos TypeScript
- Função `criarAcordoCondenacao()`
- Função `listarAcordosCondenacoes()` com paginação e filtros
- Função `buscarAcordoCondenacaoPorId()`
- Função `atualizarAcordoCondenacao()`
- Função `deletarAcordoCondenacao()`
- **Validação:** Unit tests passam ou teste manual via tsx

### 6. Criar `parcela-persistence.service.ts`
- Interface de tipos TypeScript
- Função `criarParcelas()` (bulk insert)
- Função `listarParcelasDoAcordo()`
- Função `buscarParcelaPorId()`
- Função `atualizarParcela()`
- Função `deletarParcelas()` (bulk delete)
- **Validação:** Unit tests passam ou teste manual via tsx

### 7. Criar `repasse-persistence.service.ts`
- Interface de tipos TypeScript
- Função `listarRepassesPendentes()` (usa view)
- Função `anexarDeclaracao()`
- Função `realizarRepasse()`
- Função `listarRepassesRealizados()`
- **Validação:** Unit tests passam ou teste manual via tsx

## Backend Services - Storage Layer (Priority: 2)

### 8. Criar interface e factory de Storage
- `storage.interface.ts` com IStorageService
- `storage-factory.ts` para criar instância baseado em ENV
- Definir tipos de providers (Minio, S3, AWS)
- **Validação:** Interface compila sem erros

### 9. Implementar `minio-storage.service.ts`
- Implementar IStorageService
- Métodos: upload(), delete(), getUrl()
- Configuração via ENV (MINIO_ENDPOINT, etc)
- Tratamento de erros
- **Validação:** Upload e download funcional com Minio

### 10. Implementar `s3-storage.service.ts`
- Implementar IStorageService
- Métodos: upload(), delete(), getUrl()
- Configuração via ENV (S3_BUCKET, etc)
- Tratamento de erros
- **Validação:** Upload e download funcional com S3 (se disponível)

## Backend Services - Business Logic (Priority: 3)

### 11. Criar `criar-acordo-condenacao.service.ts`
- Validar dados de entrada
- Criar registro principal
- Calcular e criar parcelas automaticamente
- Distribuir valores entre parcelas
- Retornar resultado completo
- **Validação:** Acordo criado com parcelas corretas

### 12. Criar `listar-acordos-condenacoes.service.ts`
- Implementar paginação
- Implementar filtros (tipo, direcao, status, processo_id)
- Incluir contagem de parcelas
- Ordenação padrão
- **Validação:** Listagem funcional com filtros

### 13. Criar `buscar-acordo-condenacao.service.ts`
- Buscar por ID
- Incluir parcelas relacionadas
- Incluir repasses pendentes
- Tratar erro 404
- **Validação:** Retorna dados completos

### 14. Criar `atualizar-acordo-condenacao.service.ts`
- Validar dados
- Atualizar registro
- Recalcular parcelas se necessário
- **Validação:** Atualização reflete corretamente

### 15. Criar `deletar-acordo-condenacao.service.ts`
- Verificar se há parcelas pagas
- Impedir deleção se houver
- Deletar em cascata se permitido
- **Validação:** Deleção funciona com validações

### 16. Criar `criar-parcelas.service.ts`
- Distribuir crédito principal igualmente
- Distribuir honorários sucumbenciais igualmente
- Calcular campos derivados
- Criar datas de vencimento espaçadas
- **Validação:** Parcelas criadas com valores corretos

### 17. Criar `atualizar-parcela.service.ts`
- Permitir edição de valores
- Marcar como editado_manualmente
- Recalcular campos derivados
- **Validação:** Edição reflete corretamente

### 18. Criar `recalcular-distribuicao.service.ts`
- Calcular saldo restante
- Buscar parcelas não editadas
- Redistribuir valores
- Recalcular campos derivados
- **Validação:** Redistribuição matemática correta

### 19. Criar `marcar-como-recebida.service.ts`
- Atualizar status da parcela
- Registrar data_efetivacao
- Atualizar status do acordo
- Definir status_repasse se aplicável
- **Validação:** Status atualizado corretamente

### 20. Criar `anexar-declaracao.service.ts`
- Validar formato de arquivo
- Fazer upload via StorageService
- Salvar path no banco
- Atualizar status_repasse
- **Validação:** Upload e status funcionam

### 21. Criar `realizar-repasse.service.ts`
- Validar que declaração existe
- Validar comprovante obrigatório
- Fazer upload de comprovante
- Registrar usuário e data
- Atualizar status_repasse
- **Validação:** Repasse registrado com evidências

### 22. Criar `listar-repasses-pendentes.service.ts`
- Usar view repasses_pendentes
- Implementar filtros
- Agrupar por status
- **Validação:** Lista correta de pendentes

## API Routes (Priority: 4)

### 23. Criar `/api/acordos-condenacoes` - GET e POST
- GET: Listar com paginação e filtros
- POST: Criar novo acordo
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoints funcionais via Postman/Swagger

### 24. Criar `/api/acordos-condenacoes/[id]` - GET, PUT, DELETE
- GET: Buscar por ID
- PUT: Atualizar acordo
- DELETE: Deletar acordo
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** CRUD completo funcional

### 25. Criar `/api/acordos-condenacoes/[id]/parcelas` - GET, POST
- GET: Listar parcelas do acordo
- POST: Criar parcela adicional (se necessário)
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoints funcionais

### 26. Criar `/api/acordos-condenacoes/[id]/parcelas/[parcelaId]` - GET, PUT
- GET: Buscar parcela específica
- PUT: Atualizar parcela
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoints funcionais

### 27. Criar `/api/acordos-condenacoes/[id]/parcelas/[parcelaId]/receber` - POST
- POST: Marcar parcela como recebida
- Validações de negócio
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoint funcional

### 28. Criar `/api/repasses` - GET
- GET: Listar repasses pendentes
- Filtros opcionais
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoint funcional

### 29. Criar `/api/repasses/[parcelaId]/declaracao` - POST
- POST: Upload de declaração
- Validação de arquivo
- Upload via StorageService
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Upload funcional

### 30. Criar `/api/repasses/[parcelaId]/repassar` - POST
- POST: Realizar repasse com comprovante
- Validações obrigatórias
- Upload via StorageService
- Autenticação obrigatória
- Documentação Swagger completa
- **Validação:** Endpoint funcional

## Swagger Documentation (Priority: 5)

### 31. Atualizar documentação Swagger
- Adicionar schemas para todas as entidades
- Documentar todos os endpoints
- Adicionar exemplos de request/response
- Validar tipos e descrições
- **Validação:** Swagger UI exibe corretamente

## Frontend - Components (Priority: 6)

### 32. Criar `acordo-condenacao-form.tsx`
- Formulário completo de criação/edição
- Validação de campos obrigatórios
- Seleção de processo
- Configuração de parcelas
- Estados de loading e erro
- **Validação:** Formulário funcional e validado

### 33. Criar `parcelas-table.tsx`
- Tabela de parcelas com ordenação
- Exibir valores calculados
- Ações por parcela (editar, marcar recebida)
- Estados de loading
- **Validação:** Tabela exibe dados corretamente

### 34. Criar `parcela-form.tsx`
- Formulário de edição de parcela
- Campos editáveis (valor, honorários)
- Validação de valores
- Preview de redistribuição
- **Validação:** Edição funcional com recálculo

### 35. Criar `repasse-dialog.tsx`
- Dialog para anexar declaração
- Dialog para realizar repasse
- Upload de arquivos
- Validações visuais
- **Validação:** Dialogs funcionais

### 36. Criar `acordo-condenacao-list.tsx`
- Lista de acordos/condenações
- Filtros e busca
- Paginação
- Actions (editar, deletar, visualizar)
- **Validação:** Lista funcional

## Frontend - Pages (Priority: 7)

### 37. Criar `/acordos-condenacoes/page.tsx`
- Página de listagem
- Integração com acordo-condenacao-list
- Filtros e busca
- Botão "Novo"
- **Validação:** Página renderiza corretamente

### 38. Criar `/acordos-condenacoes/novo/page.tsx`
- Página de criação
- Integração com acordo-condenacao-form
- Redirecionamento após criação
- **Validação:** Criação funcional

### 39. Criar `/acordos-condenacoes/[id]/page.tsx`
- Página de detalhes
- Exibir informações do acordo
- Exibir tabela de parcelas
- Ações (editar, deletar)
- **Validação:** Página renderiza dados

### 40. Criar `/acordos-condenacoes/[id]/editar/page.tsx`
- Página de edição
- Pré-preencher formulário
- Salvar alterações
- **Validação:** Edição funcional

### 41. Criar `/repasses/page.tsx`
- Página de repasses pendentes
- Lista agrupada por status
- Ações (anexar declaração, realizar repasse)
- **Validação:** Página funcional

## Testing & Validation (Priority: 8)

### 42. Testar fluxo completo: Acordo → Parcelas → Repasse
- Criar acordo de teste
- Verificar parcelas criadas
- Marcar como recebida
- Anexar declaração
- Realizar repasse
- **Validação:** Fluxo end-to-end funcional

### 43. Testar redistribuição de valores
- Editar valor de uma parcela
- Verificar redistribuição automática
- Editar múltiplas parcelas
- Resetar distribuição
- **Validação:** Cálculos matemáticos corretos

### 44. Testar validações e erros
- Tentar criar sem campos obrigatórios
- Tentar repasse sem declaração
- Tentar deletar acordo com parcelas pagas
- **Validação:** Erros tratados corretamente

### 45. Testar storage de arquivos
- Upload de declaração
- Upload de comprovante
- Download de arquivos
- Deleção de arquivos
- **Validação:** Storage funcional

## Documentation & Deployment (Priority: 9)

### 46. Criar README da feature
- Documentar estrutura de dados
- Documentar fluxos principais
- Documentar variáveis de ambiente
- Exemplos de uso
- **Validação:** Documentação clara

### 47. Configurar variáveis de ambiente
- Adicionar ao .env.example
- Documentar cada variável
- Configurar em ambientes (dev/prod)
- **Validação:** Variáveis documentadas

### 48. Migration final e deploy
- Verificar todas as migrations
- Aplicar em ambiente de staging
- Testar em staging
- Deploy em produção
- **Validação:** Sistema em produção funcional

## Dependencies & Parallelization

**Pode ser feito em paralelo:**
- Tasks 5, 6, 7 (persistence services)
- Tasks 9, 10 (storage implementations)
- Tasks 11-22 (business logic services) após Tasks 5-7
- Tasks 23-30 (API routes) após Tasks 11-22
- Tasks 32-36 (components) após Tasks 23-30
- Tasks 37-41 (pages) após Tasks 32-36

**Deve ser sequencial:**
- Tasks 1-4 (database) antes de tudo
- Task 8 (storage interface) antes de Tasks 9-10
- Tasks 42-45 (testing) após tudo implementado
- Tasks 46-48 (docs/deploy) ao final
