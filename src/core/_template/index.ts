/**
 * _TEMPLATE MODULE - Exports Públicos
 *
 * Este módulo serve como gabarito para novos módulos do core.
 * Para criar um novo módulo:
 *
 * 1. Copie a pasta _template para src/core/[nome-do-modulo]
 * 2. Renomeie as entidades (Tarefa -> SuaEntidade)
 * 3. Ajuste os schemas Zod
 * 4. Implemente as queries no repository
 * 5. Adicione regras de negócio no service
 *
 * ESTRUTURA:
 * - domain.ts: Entidades e schemas de validação
 * - repository.ts: Acesso ao banco de dados
 * - service.ts: Regras de negócio (casos de uso)
 * - index.ts: Exports públicos do módulo
 */

// Domain (tipos e schemas)
export {
  type Tarefa,
  type CreateTarefaInput,
  type UpdateTarefaInput,
  type ListTarefasParams,
  createTarefaSchema,
  updateTarefaSchema,
} from './domain';

// Services (casos de uso) - API pública do módulo
export {
  criarTarefa,
  buscarTarefa,
  listarTarefas,
  atualizarTarefa,
  concluirTarefa,
  reabrirTarefa,
  removerTarefa,
} from './service';

// Repository NÃO é exportado publicamente
// Os serviços devem ser a única interface para acesso aos dados
