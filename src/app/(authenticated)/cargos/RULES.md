# Regras de Negocio - Cargos

## Contexto
Cadastro auxiliar de cargos (funcoes) dos usuarios do sistema. Modulo CRUD com validacao de unicidade e protecao contra exclusao de cargos em uso.

## Entidades Principais
- **Cargo**: Registro com nome, descricao, status ativo e criador

## Regras de Validacao
- `nome`: obrigatorio, minimo 3 caracteres
- `descricao`: opcional
- `ativo`: boolean, default `true`
- Atualizacao: todos os campos sao opcionais (partial)

## Regras de Negocio
- **Unicidade de nome**: nao permite criar cargo com nome ja existente (case-insensitive na atualizacao)
- **Protecao contra exclusao com usuarios**: nao permite deletar cargo que possui usuarios associados; retorna `CargoComUsuariosError` com lista de usuarios vinculados
- **Verificacao de existencia**: atualizar e deletar exigem que o registro exista
- Service lanca `Error` (nao usa pattern Result)

## Filtros de Listagem
- `busca`: busca textual
- `ativo`: filtrar por status
- `ordenarPor`: `nome`, `createdAt`, `updatedAt`
- `ordem`: `asc`, `desc`

## Revalidacao de Cache
- `revalidatePath("/app/usuarios/cargos")` ao criar, atualizar e deletar
- `revalidatePath("/app/usuarios")` ao criar
