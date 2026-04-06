# Regras de Negocio - Tipos de Expedientes

## Contexto
Cadastro auxiliar de tipos de expedientes utilizados para classificar expedientes judiciais. Modulo CRUD simples com validacao de unicidade.

## Entidades Principais
- **TipoExpediente**: Registro com nome (`tipoExpediente`), criador e timestamps

## Regras de Validacao
- `tipoExpediente`: obrigatorio, 1-255 caracteres (trimmed)
- Paginacao: `pagina` min 1, `limite` min 1 max 100 (default 50)
- Ordenacao: por `tipoExpediente`, `createdAt` ou `updatedAt` (default: `tipoExpediente ASC`)

## Regras de Negocio
- **Unicidade de nome**: nao permite criar tipo com nome ja existente; na atualizacao, valida unicidade apenas se o nome mudou (excluindo o proprio registro)
- **Protecao contra exclusao em uso**: nao permite deletar tipo que esta vinculado a expedientes (`isInUse`)
- **Verificacao de existencia**: atualizar e deletar exigem que o registro exista
- Service lanca `Error` (nao usa pattern Result)

## Revalidacao de Cache
- `revalidatePath("/app/tipos-expedientes")` ao criar, atualizar e deletar
