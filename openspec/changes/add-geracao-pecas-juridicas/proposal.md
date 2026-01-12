# Change: Geração de Peças Jurídicas com Placeholders

## Why

Escritórios de advocacia precisam gerar documentos jurídicos (petições iniciais, contestações, recursos) de forma rápida e padronizada. Atualmente, advogados copiam modelos manualmente e substituem dados de qualificação das partes, processo error-prone e demorado. Esta feature automatiza a geração de peças a partir de modelos pré-configurados, importando automaticamente dados de clientes e partes contrárias vinculados a contratos.

## What Changes

- **Nova entidade `pecas_modelos`**: Tabela separada para modelos de peças jurídicas com campos específicos (tipo de peça, entidade vinculada, placeholders definidos)
- **Nova entidade `contrato_documentos`**: Vinculação entre contratos e documentos gerados, permitindo rastrear todas as peças de um contrato
- **Sistema de Placeholders Indexados**: Suporte a `{{autor_1.nome}}`, `{{autor_2.cpf}}`, `{{reu_1.endereco_completo}}` para contratos com múltiplas partes
- **Interface de geração**: Modal/Sheet para selecionar modelo e gerar peça a partir de um contrato
- **Exportação**: Documentos gerados podem ser exportados em DOCX e PDF (reusa infraestrutura existente)

## Impact

- **Affected specs**:
  - `specs/contratos/spec.md` - Adiciona ação de gerar peça
  - `specs/documentos-editor/spec.md` - Referência templates de peças
  - Nova spec: `specs/pecas-juridicas/spec.md`
- **Affected code**:
  - `src/features/pecas-juridicas/` - Novo módulo
  - `src/features/contratos/components/` - Botão de gerar peça
  - `supabase/schemas/` - Novas tabelas
- **Database changes**:
  - Nova tabela `pecas_modelos`
  - Nova tabela `contrato_documentos`
  - Possível nova tabela `placeholder_definicoes` (metadata)

## Architecture Decision

### Placeholders - Sistema Indexado
Optou-se por placeholders indexados (`{{autor_1.nome}}`, `{{autor_2.nome}}`) ao invés de blocos iterativos ou lista automática porque:
1. Advogados frequentemente precisam de formatação específica por parte
2. Permite controle granular sobre posicionamento no documento
3. Compatível com o editor Plate.js existente
4. Mais intuitivo para usuários criarem modelos

### Entidade Separada para Modelos
Optou-se por criar `pecas_modelos` separado da tabela `templates` existente porque:
1. Modelos de peças possuem campos específicos (tipo_peca, entidade_vinculada, placeholders_obrigatorios)
2. Validação diferente (peças precisam de placeholders válidos)
3. Workflow diferente (geração a partir de contrato vs criação livre)
4. Permite categorização jurídica específica (petição inicial, contestação, recurso, etc.)
