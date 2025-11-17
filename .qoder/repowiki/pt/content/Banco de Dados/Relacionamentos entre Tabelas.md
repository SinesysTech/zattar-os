# Relacionamentos entre Tabelas

<cite>
**Arquivos Referenciados neste Documento**   
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql)
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql)
- [09_clientes.sql](file://supabase/schemas/09_clientes.sql)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql)
- [20251117015305_add_responsavel_id_tables.sql](file://supabase/migrations/20251117015305_add_responsavel_id_tables.sql)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Relacionamentos de Chave Estrangeira](#relacionamentos-de-chave-estrangeira)
3. [Diagrama ER (Entidade-Relacionamento)](#diagrama-er-entidade-relacionamento)
4. [Tipos de Relacionamento](#tipos-de-relacionamento)
5. [Integridade Referencial](#integridade-referencial)
6. [Exemplos de JOINs](#exemplos-de-joins)
7. [Relação com Modelos de Domínio](#relação-com-modelos-de-domínio)

## Introdução
Este documento detalha os relacionamentos entre as tabelas do banco de dados Sinesys, com foco nas chaves estrangeiras que conectam entidades como contratos, processos, clientes, usuários e pendências. O sistema é projetado para gerenciar informações jurídicas de forma estruturada, permitindo rastrear responsabilidades, atribuições e vínculos entre diferentes entidades do sistema. A análise inclui um diagrama ER, explicação dos tipos de relacionamento, integridade referencial e exemplos práticos de consultas com JOINs.

## Relacionamentos de Chave Estrangeira

### contrato_id em contrato_processos
A tabela `contrato_processos` estabelece um relacionamento muitos-para-muitos entre contratos e processos jurídicos. A coluna `contrato_id` é uma chave estrangeira que referencia a tabela `contratos`, garantindo que cada processo associado a um contrato esteja vinculado a um contrato válido. A restrição `on delete cascade` assegura que, ao excluir um contrato, todos os seus processos associados sejam automaticamente removidos.

**Seção fontes**
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql#L6)

### cliente_id em contratos
Na tabela `contratos`, a coluna `cliente_id` é uma chave estrangeira que referencia a tabela `clientes`. Este relacionamento é do tipo um-para-muitos, onde um cliente pode ter múltiplos contratos, mas cada contrato pertence a um único cliente. A restrição `on delete restrict` impede a exclusão de um cliente que ainda tenha contratos ativos, protegendo a integridade dos dados.

**Seção fontes**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L13)

### responsavel_id em acervo, audiencias e pendentes_manifestacao
A coluna `responsavel_id` foi adicionada às tabelas `acervo`, `audiencias` e `pendentes_manifestacao` para permitir a atribuição de responsáveis por processos e pendências. Esta chave estrangeira referencia a tabela `usuarios`, estabelecendo um relacionamento muitos-para-um, onde múltiplos processos podem ser atribuídos ao mesmo usuário. A restrição `on delete set null` garante que, ao excluir um usuário, os registros que ele gerenciava mantenham seus dados, apenas removendo a referência ao responsável.

**Seção fontes**
- [20251117015305_add_responsavel_id_tables.sql](file://supabase/migrations/20251117015305_add_responsavel_id_tables.sql#L6-L7)
- [20251117015305_add_responsavel_id_tables.sql](file://supabase/migrations/20251117015305_add_responsavel_id_tables.sql#L15-L16)
- [20251117015305_add_responsavel_id_tables.sql](file://supabase/migrations/20251117015305_add_responsavel_id_tables.sql#L24-L25)

### usuario_id em várias tabelas
A tabela `usuarios` é referenciada por múltiplas entidades como `contratos`, `acervo`, `audiencias` e `pendentes_manifestacao` através da coluna `responsavel_id`. Este padrão centraliza a gestão de responsabilidades no sistema, permitindo rastrear quem é responsável por cada entidade. A relação é sempre muitos-para-um, com a possibilidade de um usuário ser responsável por diversos processos ou contratos.

**Seção fontes**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L31)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql#L9)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql#L8)

## Diagrama ER (Entidade-Relacionamento)

```mermaid
erDiagram
USUARIOS {
bigint id PK
text nome_completo
text email_corporativo UK
boolean ativo
uuid auth_user_id FK
}
CLIENTES {
bigint id PK
text nome
text cpf UK
text cnpj UK
public.tipo_pessoa tipo_pessoa
boolean ativo
}
CONTRATOS {
bigint id PK
public.area_direito area_direito
public.tipo_contrato tipo_contrato
bigint cliente_id FK
bigint responsavel_id FK
bigint created_by FK
}
ACERVO {
bigint id PK
bigint id_pje
bigint advogado_id FK
text numero_processo
bigint responsavel_id FK
}
PENDENTES_MANIFESTACAO {
bigint id PK
bigint id_pje
bigint advogado_id FK
bigint processo_id FK
bigint responsavel_id FK
}
CONTRATO_PROCESSOS {
bigint id PK
bigint contrato_id FK
bigint processo_id FK
}
USUARIOS ||--o{ CONTRATOS : "criado_por"
USUARIOS ||--o{ CONTRATOS : "responsavel_por"
USUARIOS ||--o{ ACERVO : "responsavel_por"
USUARIOS ||--o{ PENDENTES_MANIFESTACAO : "responsavel_por"
CLIENTES ||--o{ CONTRATOS : "possui"
CONTRATOS ||--o{ CONTRATO_PROCESSOS : "contém"
ACERVO ||--o{ CONTRATO_PROCESSOS : "associado_a"
ACERVO ||--o{ PENDENTES_MANIFESTACAO : "relacionado_a"
```

**Fontes do Diagrama**
- [08_usuarios.sql](file://supabase/schemas/08_usuarios.sql#L5)
- [09_clientes.sql](file://supabase/schemas/09_clientes.sql#L5)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L5)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql#L5)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql#L5)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql#L5)

## Tipos de Relacionamento

### Um-para-Muitos (1:N)
O relacionamento entre `clientes` e `contratos` é um exemplo clássico de um-para-muitos. Um cliente pode ter vários contratos, mas cada contrato pertence a apenas um cliente. Este tipo de relacionamento é implementado com uma chave estrangeira na tabela filha (`contratos`) que referencia a chave primária da tabela pai (`clientes`).

### Muitos-para-Um (N:1)
Os relacionamentos envolvendo `responsavel_id` são do tipo muitos-para-um. Múltiplos registros em tabelas como `acervo`, `audiencias` e `pendentes_manifestacao` podem ser atribuídos ao mesmo usuário. A chave estrangeira `responsavel_id` na tabela filha referencia a chave primária `id` na tabela `usuarios`.

### Muitos-para-Muitos (N:N)
O relacionamento entre `contratos` e `processos` é implementado como muitos-para-muitos através da tabela de junção `contrato_processos`. Um contrato pode ter vários processos, e um processo pode estar associado a múltiplos contratos. Esta tabela intermediária contém chaves estrangeiras para ambas as tabelas principais, formando uma relação composta.

**Seção fontes**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L13)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql#L7)
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql#L6-L7)

## Integridade Referencial
A integridade referencial é mantida através de restrições de chave estrangeira definidas no banco de dados. Quando uma entidade pai é excluída, o comportamento é determinado pela cláusula `ON DELETE`:

- **CASCADE**: Usado em `contrato_processos`, onde a exclusão de um contrato ou processo resulta na exclusão automática dos registros de relacionamento.
- **RESTRICT**: Aplicado em `contratos.cliente_id`, impedindo a exclusão de um cliente com contratos ativos.
- **SET NULL**: Utilizado em `responsavel_id`, permitindo que registros mantenham seus dados mesmo após a exclusão do usuário responsável.

Essas restrições garantem que o banco de dados permaneça consistente e evite referências órfãs.

**Seção fontes**
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql#L6-L7)
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L13)
- [20251117015305_add_responsavel_id_tables.sql](file://supabase/migrations/20251117015305_add_responsavel_id_tables.sql#L7)

## Exemplos de JOINs

### Listar Processos de um Contrato
Para obter todos os processos associados a um contrato específico, utiliza-se um JOIN entre `contratos`, `contrato_processos` e `acervo`:

```sql
SELECT 
  c.id as contrato_id,
  a.numero_processo,
  a.nome_parte_autora,
  a.nome_parte_re
FROM contratos c
JOIN contrato_processos cp ON c.id = cp.contrato_id
JOIN acervo a ON cp.processo_id = a.id
WHERE c.id = :contrato_id;
```

### Pendências Atribuídas a um Usuário
Para listar todas as pendências de manifestação atribuídas a um usuário, utiliza-se um simples JOIN com a tabela `usuarios`:

```sql
SELECT 
  p.id,
  p.numero_processo,
  p.nome_parte_autora,
  p.nome_parte_re,
  p.data_prazo_legal_parte
FROM pendentes_manifestacao p
JOIN usuarios u ON p.responsavel_id = u.id
WHERE u.id = :usuario_id AND p.prazo_vencido = false;
```

**Seção fontes**
- [12_contrato_processos.sql](file://supabase/schemas/12_contrato_processos.sql#L6-L7)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql#L8)

## Relação com Modelos de Domínio
Os relacionamentos no banco de dados refletem diretamente os modelos de domínio no backend. Por exemplo, a entidade `Contrato` no código possui uma coleção de `Processo`, mapeada para a tabela `contrato_processos`. Da mesma forma, a propriedade `responsavel` em entidades como `Acervo` e `PendenteManifestacao` é representada pela coluna `responsavel_id`, permitindo atribuição e rastreamento de responsabilidades. Os serviços de persistência utilizam essas relações para operações de CRUD, garantindo consistência entre a camada de domínio e o armazenamento de dados.

**Seção fontes**
- [11_contratos.sql](file://supabase/schemas/11_contratos.sql#L31)
- [04_acervo.sql](file://supabase/schemas/04_acervo.sql#L9)
- [06_pendentes_manifestacao.sql](file://supabase/schemas/06_pendentes_manifestacao.sql#L8)