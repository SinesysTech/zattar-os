# Regras de Negocio - Pecas Juridicas

## Contexto
Modulo de modelos de pecas juridicas (peticoes, contestacoes, recursos etc.) com sistema de placeholders para geracao automatizada de documentos vinculados a contratos. Utiliza editor Plate.js.

## Entidades Principais
- **PecaModelo**: Modelo reutilizavel de peca juridica com conteudo Plate.js e placeholders
- **ContratoDocumento**: Vinculo entre documento/arquivo e contrato, opcionalmente gerado a partir de um modelo

## Enums e Constantes
- **TipoPecaJuridica**: `peticao_inicial`, `contestacao`, `recurso_ordinario`, `agravo`, `embargos_declaracao`, `manifestacao`, `parecer`, `contrato_honorarios`, `procuracao`, `outro`
- **VisibilidadeModelo**: `publico`, `privado` (default: `privado`)

## Regras de Validacao
### PecaModelo
- `titulo`: obrigatorio, 1-255 caracteres
- `descricao`: opcional, max 1000 caracteres
- `tipoPeca`: default `outro`
- `conteudo`: array (Plate.js Value), default `[]`
- `visibilidade`: default `privado`

### ContratoDocumento
- Deve ter `documentoId` OU `arquivoId` (pelo menos um)
- `contratoId`: obrigatorio, positivo

### Geracao de Peca
- `contratoId`, `modeloId`, `titulo`: todos obrigatorios

## Regras de Negocio
- **Extracao automatica de placeholders**: ao criar/atualizar modelo, placeholders sao extraidos do conteudo via `extractPlaceholders`
- **Geracao de peca**: busca modelo -> resolve placeholders com dados do contexto -> cria documento via `criarDocumento` -> vincula ao contrato
- **Preview**: permite visualizar resolucao de placeholders antes de gerar
- **Soft delete** para modelos (campo `ativo`)
- **Contador de uso** (`uso_count`) no modelo
- **Listagem**: suporta filtros por tipo, visibilidade, segmento, criador e status ativo

## Revalidacao de Cache
- `revalidatePath("/app/pecas-juridicas")` ao criar/atualizar/deletar modelo
- `revalidatePath("/app/pecas-juridicas/{id}")` ao atualizar modelo
- `revalidatePath("/app/contratos/{contratoId}")` e `revalidatePath("/app/documentos")` ao gerar/vincular/desvincular pecas
