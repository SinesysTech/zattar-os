# Design: Sistema de Acordos, Condenações e Pagamentos

## Arquitetura

### Estrutura de Dados

#### Tabela: `acordos_condenacoes`
Registro principal de acordos, condenações ou custas processuais.

**Campos principais:**
- `processo_id`: FK para processos
- `tipo`: enum('acordo', 'condenacao', 'custas_processuais')
- `direcao`: enum('recebimento', 'pagamento')
- `valor_total`: valor total do acordo/condenação
- `numero_parcelas`: quantidade de parcelas
- `forma_distribuicao`: enum('integral', 'dividido') - como será distribuído
- `percentual_escritorio`: padrão 30%, editável
- `honorarios_sucumbenciais_total`: valor total de sucumbenciais

**Relacionamentos:**
- `processos.id` → `acordos_condenacoes.processo_id`
- `acordos_condenacoes.id` → `parcelas.acordo_condenacao_id`

#### Tabela: `parcelas`
Parcelas individuais de um acordo/condenação.

**Campos principais:**
- `acordo_condenacao_id`: FK para acordos_condenacoes
- `numero_parcela`: ordem da parcela
- `valor_bruto_credito_principal`: editável pelo usuário
- `honorarios_contratuais`: calculado automaticamente
- `honorarios_sucumbenciais`: editável pelo usuário
- `forma_pagamento`: enum('transferencia_direta', 'deposito_judicial', 'deposito_recursal')
- `status`: enum('pendente', 'recebida', 'paga', 'atrasado')
- `editado_manualmente`: flag para controle de redistribuição

**Campos de Repasse (quando forma_distribuicao = integral):**
- `valor_repasse_cliente`: calculado automaticamente (70% do crédito)
- `status_repasse`: enum('nao_aplicavel', 'pendente_declaracao', 'pendente_transferencia', 'repassado')
- `arquivo_declaracao_prestacao_contas`: path do arquivo
- `arquivo_comprovante_repasse`: path do arquivo (obrigatório)

### Lógica de Negócio

#### 1. Distribuição Automática Inicial
Ao criar um acordo/condenação:
1. Dividir `credito_principal` igualmente entre N parcelas
2. Dividir `honorarios_sucumbenciais_total` igualmente entre N parcelas
3. Calcular `honorarios_contratuais` = `valor_bruto * percentual_escritorio`
4. Calcular `valor_repasse_cliente` = `valor_bruto * percentual_cliente` (se aplicável)

#### 2. Recálculo após Edição Manual
Quando usuário edita uma parcela:
1. Marcar `editado_manualmente = true`
2. Calcular saldo restante = total - soma(parcelas editadas)
3. Redistribuir saldo entre parcelas NÃO editadas
4. Recalcular campos derivados (honorarios_contratuais, valor_repasse)

Mesma lógica para edição de `honorarios_sucumbenciais`.

#### 3. Fluxo de Repasse ao Cliente
Quando `forma_distribuicao = 'integral'`:

**Etapa 1:** Parcela marcada como recebida
- `status_repasse` → `'pendente_declaracao'`

**Etapa 2:** Upload da declaração de prestação de contas
- `status_repasse` → `'pendente_transferencia'`
- Parcela fica disponível para transferência

**Etapa 3:** Transferência realizada + upload comprovante
- Validar que comprovante foi anexado (obrigatório)
- Registrar `usuario_repasse_id` e `data_repasse`
- `status_repasse` → `'repassado'`

#### 4. Triggers e Automações

**Trigger: Parcela Atrasada**
```sql
IF data_vencimento < CURRENT_DATE AND status = 'pendente'
THEN status = 'atrasado'
```

**Trigger: Status do Acordo**
```sql
-- Atualiza status principal baseado nas parcelas
IF todas parcelas = 'recebida/paga' THEN 'pago_total'
ELSE IF alguma parcela = 'recebida/paga' THEN 'pago_parcial'
ELSE IF alguma parcela = 'atrasado' THEN 'atrasado'
ELSE 'pendente'
```

### Abstração de Storage

#### Interface
```typescript
interface IStorageService {
  upload(file: File, path: string): Promise<string>
  delete(path: string): Promise<void>
  getUrl(path: string): Promise<string>
}
```

#### Implementações
- `MinioStorageService`
- `S3StorageService`
- `AWSStorageService`

#### Configuração (ENV)
```env
STORAGE_PROVIDER=minio|s3|aws
STORAGE_ENDPOINT=...
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

### Índices de Banco

#### acordos_condenacoes
- `idx_processo_id` (lookup rápido por processo)
- `idx_status` (filtros de listagem)
- `idx_tipo_direcao` (filtros combinados)

#### parcelas
- `idx_acordo_condenacao_id` (lookup de parcelas)
- `idx_status` (filtros)
- `idx_status_repasse` (view de repasses pendentes)
- `idx_data_vencimento` (job de atualização de status)

### View: repasses_pendentes
Facilita consulta de repasses que precisam ser processados:

```sql
CREATE VIEW repasses_pendentes AS
SELECT
  p.*,
  ac.processo_id,
  ac.percentual_cliente
FROM parcelas p
JOIN acordos_condenacoes ac ON p.acordo_condenacao_id = ac.id
WHERE
  ac.forma_distribuicao = 'integral'
  AND p.status = 'recebida'
  AND p.status_repasse IN ('pendente_declaracao', 'pendente_transferencia')
ORDER BY p.status_repasse, p.data_efetivacao
```

## Padrões Seguidos

### Nomenclatura
- Tabelas: `snake_case`
- Arquivos: `kebab-case.ts`
- Componentes React: `PascalCase.tsx`
- Serviços: `[acao]-[entidade].service.ts`

### Estrutura de Diretórios
```
backend/
  acordos-condenacoes/
    services/
      acordos-condenacoes/
        criar-acordo-condenacao.service.ts
        listar-acordos-condenacoes.service.ts
        buscar-acordo-condenacao.service.ts
        atualizar-acordo-condenacao.service.ts
        deletar-acordo-condenacao.service.ts
      parcelas/
        criar-parcelas.service.ts
        atualizar-parcela.service.ts
        marcar-como-recebida.service.ts
        recalcular-distribuicao.service.ts
      repasses/
        anexar-declaracao.service.ts
        realizar-repasse.service.ts
        listar-repasses-pendentes.service.ts
      persistence/
        acordo-condenacao-persistence.service.ts
        parcela-persistence.service.ts
        repasse-persistence.service.ts
      storage/
        storage.interface.ts
        minio-storage.service.ts
        s3-storage.service.ts
        storage-factory.ts

app/
  api/
    acordos-condenacoes/
      route.ts (GET, POST)
      [id]/route.ts (GET, PUT, DELETE)
      [id]/parcelas/route.ts (GET, POST)
      [id]/parcelas/[parcelaId]/route.ts (GET, PUT)
      [id]/parcelas/[parcelaId]/receber/route.ts (POST)
    repasses/
      route.ts (GET - lista pendentes)
      [parcelaId]/declaracao/route.ts (POST)
      [parcelaId]/repassar/route.ts (POST)

  (dashboard)/
    acordos-condenacoes/
      page.tsx (lista)
      novo/page.tsx (criar)
      [id]/page.tsx (detalhes)
      [id]/editar/page.tsx (editar)
    repasses/
      page.tsx (lista pendentes)

components/
  acordos-condenacoes/
    acordo-condenacao-form.tsx
    parcelas-table.tsx
    parcela-form.tsx
    repasse-dialog.tsx
```

## Trade-offs e Decisões

### 1. JSONB vs Tabelas Separadas
**Decisão:** Tabela `parcelas` separada
**Razão:** Queries complexas, cálculos, triggers e edições frequentes

### 2. Forma de Pagamento por Parcela
**Decisão:** Campo `forma_pagamento` na tabela `parcelas`
**Razão:** Flexibilidade para pagamentos híbridos (parte via alvará, parte transferência)

### 3. Storage Abstrato
**Decisão:** Interface + implementações múltiplas
**Razão:** Diferentes ambientes podem usar diferentes providers (Minio local, S3 produção)

### 4. Redistribuição Automática
**Decisão:** Recalcular automaticamente ao editar parcela
**Razão:** Mantém integridade dos valores sem travar usuário

### 5. Comprovante Obrigatório
**Decisão:** Validar upload antes de marcar como repassado
**Razão:** Auditoria e compliance jurídico

## Considerações de Segurança

1. **RLS Policies**: Todas as tabelas com políticas por operação
2. **Validação de Valores**: Backend valida soma de parcelas = total
3. **Auditoria**: Triggers de `updated_at` e logs de mudanças
4. **Storage**: Arquivos restritos por processo/usuário
5. **Comprovantes**: Validação de formato e tamanho
