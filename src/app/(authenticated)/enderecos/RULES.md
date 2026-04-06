# Regras de Negocio - Enderecos

## Contexto
Modulo de enderecos fisicos associados a entidades do sistema (clientes, partes contrarias, terceiros). Suporta integracao com PJE e validacao de CEP.

## Entidades Principais
- **Endereco**: Endereco completo com logradouro, municipio, estado, CEP, classificacoes e dados PJE

## Enums e Constantes
- **EntidadeTipoEndereco**: `cliente`, `parte_contraria`, `terceiro` (relacao polimorfica)
- **SituacaoEndereco**: `A` (Ativo), `I` (Inativo), `P` (Principal/correspondencia), `H` (Historico)
- **GrauProcesso**: `primeiro_grau`, `segundo_grau`, `tribunal_superior`

## Regras de Validacao (domain.ts)
- `cep`: minimo 8 digitos, normalizado (remove nao-digitos)
- `municipio`: obrigatorio
- `estado`: obrigatorio, minimo 2 caracteres
- `logradouro`, `numero`, `complemento`, `bairro`: opcionais

## Regras de Negocio
- Service e uma camada fina que delega diretamente ao repository (sem logica de negocio adicional)
- Suporta busca por entidade (`entidade_tipo` + `entidade_id`)
- Suporta upsert por `id_pje` para sincronizacao com PJE
- Campos PJE: `id_pje`, `id_municipio_pje`, `estado_id_pje`, `pais_id_pje`, `dados_pje_completo` (JSONB)
- Classificacoes de endereco armazenadas como array JSONB (`classificacoes_endereco`)
- Flag `correspondencia` indica endereco de correspondencia

## Filtros de Listagem
- `entidade_tipo`, `entidade_id`, `trt`, `grau`, `numero_processo`
- `municipio`, `estado_sigla`, `estado`, `pais`, `cep`
- `correspondencia`, `situacao`, `ativo`, `busca`
- Ordenacao: `created_at`, `municipio`, `estado`, `cep`

## Revalidacao de Cache
- `revalidatePath("/app/enderecos")` ao criar, atualizar e deletar
