# Captura de Partes - Módulo Técnico

## Visão Geral

Este módulo implementa a captura automatizada de partes de processos do PJE-TRT (Processo Judicial Eletrônico dos Tribunais Regionais do Trabalho). Ele identifica automaticamente quais partes são nossos clientes, quais são partes contrárias, e quais são terceiros (peritos, MP, etc.), persistindo todas as informações no banco de dados com relacionamentos corretos.

## Arquitetura

O módulo é composto por três arquivos principais:

```
backend/captura/services/partes/
├── partes-capture.service.ts      # Orquestração end-to-end da captura
├── identificacao-partes.service.ts # Lógica de identificação de tipo de parte
├── types.ts                        # Tipos TypeScript
└── __tests__/
    └── identificacao-partes.test.ts # 78 testes unitários
```

### Separação de Responsabilidades

1. **partes-capture.service.ts**: Orquestra todo o fluxo de captura
   - Busca partes via API PJE
   - Chama identificação de tipo
   - Faz upsert nas tabelas apropriadas
   - Salva representantes e endereços
   - Cria vínculos processo-partes

2. **identificacao-partes.service.ts**: Lógica pura de classificação
   - Sem dependências de banco de dados
   - Algoritmo determinístico
   - Testável unitariamente

3. **types.ts**: Definições de tipos compartilhadas
   - Resultado de captura
   - Erros de processamento
   - Union types para classificação

## Algoritmo de Identificação

A função `identificarTipoParte()` classifica cada parte usando um algoritmo de prioridade:

### 1. Tipos Especiais (Terceiros) - Prioridade Máxima

Se o `tipoParte` retornado pelo PJE está na lista de tipos especiais, a parte é classificada como **terceiro**, independentemente dos representantes:

```typescript
const TIPOS_ESPECIAIS = [
  'PERITO',
  'PERITO_CONTADOR',
  'PERITO_MEDICO',
  'PERITO_JUDICIAL',
  'MINISTERIO_PUBLICO',
  'MINISTERIO_PUBLICO_TRABALHO',
  'ASSISTENTE',
  'ASSISTENTE_TECNICO',
  'TESTEMUNHA',
  'CUSTOS_LEGIS',
  'AMICUS_CURIAE',
  // ... e outros
];
```

**Exemplo**: Um perito, mesmo que representado por advogado do escritório, será sempre classificado como terceiro.

### 2. Matching de Representantes (Cliente)

Se não é tipo especial, o algoritmo verifica se algum representante da parte tem CPF igual ao CPF do advogado dono da credencial:

```typescript
// Normaliza CPFs (remove formatação)
const cpfAdvogado = normalizarCpf(advogado.cpf);          // "123.456.789-00" → "12345678900"
const cpfRepresentante = normalizarCpf(rep.numeroDocumento);

// Compara CPFs normalizados
if (cpfRepresentante === cpfAdvogado) {
  return 'cliente'; // ✅ Parte é nosso cliente
}
```

**Comportamento**:
- Comparação case-insensitive
- Aceita CPF formatado ou não formatado
- Valida CPFs (11 dígitos, não pode ser sequência de zeros)

### 3. Fallback (Parte Contrária)

Se nenhum representante deu match, a parte é classificada como **parte_contraria**:

```typescript
// Nenhum representante é do escritório
return 'parte_contraria';
```

### Casos Especiais

| Situação | Classificação | Comportamento |
|----------|---------------|---------------|
| Parte sem representantes | `parte_contraria` | Log de warning |
| CPF do advogado inválido | `parte_contraria` | Log de warning |
| Representante com CPF inválido | Continua verificação | Pula representante |
| Parte sem dados | Exceção | Lança erro |

## Fluxo de Captura Completo

```
┌──────────────────────────────────────────────────────────┐
│  1. capturarPartesProcesso()                             │
│     - Recebe: page (Playwright), processo, advogado      │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  2. obterPartesProcesso() (API PJE)                      │
│     - Busca todas as partes do processo via browser      │
│     - Retorna: PartePJE[]                                │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  3. Loop: Para cada parte                                │
└──────────────┬───────────────────────────────────────────┘
               │
               ├──► identificarTipoParte()
               │    └─► Retorna: 'cliente' | 'parte_contraria' | 'terceiro'
               │
               ├──► processarParte()
               │    └─► Upsert em clientes / partes_contrarias / terceiros
               │        (por id_pessoa_pje)
               │
               ├──► processarEndereco()
               │    └─► Upsert em enderecos (tabela polimórfica)
               │
               ├──► processarRepresentantes()
               │    └─► Upsert em representantes para cada representante
               │
               └──► criarVinculoProcessoParte()
                    └─► Insert em processo_partes (many-to-many)
```

### Tratamento de Erros

- **Erro em uma parte**: Não interrompe processamento das demais
- **Erros são coletados**: Array `erros[]` no resultado
- **Logging detalhado**: Console logs em cada etapa
- **Resultado parcial**: Contadores refletem sucessos reais

## Uso da API

### Endpoint REST

```typescript
POST /api/captura/trt/partes
Content-Type: application/json
Authorization: Bearer <token>

{
  "processoId": 123,
  "credencialId": 1
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Partes capturadas com sucesso",
  "data": {
    "processoId": 123,
    "numeroProcesso": "0001234-56.2024.5.03.0001",
    "totalPartes": 3,
    "clientes": 1,
    "partesContrarias": 1,
    "terceiros": 1,
    "representantes": 5,
    "vinculos": 3,
    "erros": [],
    "duracaoMs": 2500
  }
}
```

### Resposta com Falha Parcial

```json
{
  "success": true,
  "message": "Captura concluída com alguns erros",
  "data": {
    "processoId": 123,
    "numeroProcesso": "0001234-56.2024.5.03.0001",
    "totalPartes": 3,
    "clientes": 1,
    "partesContrarias": 0,
    "terceiros": 1,
    "representantes": 3,
    "vinculos": 2,
    "erros": [
      {
        "parteIndex": 1,
        "parteDados": {
          "idParte": 456,
          "nome": "Empresa XYZ LTDA"
        },
        "erro": "Erro ao fazer upsert: CNPJ inválido"
      }
    ],
    "duracaoMs": 3200
  }
}
```

## Exemplos de Código

### Exemplo 1: Uso Direto do Serviço

```typescript
import { capturarPartesProcesso } from '@/backend/captura/services/partes/partes-capture.service';
import type { Page } from 'playwright';

const page: Page = ...; // Página autenticada no PJE

const processo = {
  id: 123,
  numero_processo: '0001234-56.2024.5.03.0001',
  id_pje: 456789,
  trt: '03',
  grau: 'primeiro_grau' as const,
};

const advogado = {
  id: 1,
  cpf: '123.456.789-00',
  nome: 'Dr. João Silva',
};

const resultado = await capturarPartesProcesso(page, processo, advogado);

console.log(`Capturados: ${resultado.clientes} clientes, ${resultado.partesContrarias} partes contrárias`);
console.log(`Erros: ${resultado.erros.length}`);
```

### Exemplo 2: Identificação Manual

```typescript
import { identificarTipoParte } from '@/backend/captura/services/partes/identificacao-partes.service';
import type { PartePJE } from '@/backend/api/pje-trt/partes/types';

const parte: PartePJE = {
  idParte: 123,
  idPessoa: 456,
  nome: 'Maria Santos',
  tipoParte: 'AUTOR',
  polo: 'ATIVO',
  numeroDocumento: '987.654.321-00',
  tipoDocumento: 'CPF',
  representantes: [
    {
      idRepresentante: 1,
      idPessoa: 789,
      nome: 'Dr. João Silva',
      numeroDocumento: '123.456.789-00', // Mesmo CPF do advogado
      tipoDocumento: 'CPF',
      numeroOAB: '12345',
      ufOAB: 'MG',
      // ...
    },
  ],
  // ...
};

const advogado = {
  id: 1,
  cpf: '123.456.789-00',
};

const tipo = identificarTipoParte(parte, advogado);
// Retorna: 'cliente'
```

### Exemplo 3: Normalização de CPF

```typescript
import { normalizarCpf } from '@/backend/captura/services/partes/identificacao-partes.service';

normalizarCpf('123.456.789-00');    // "12345678900"
normalizarCpf('123 456 789 00');    // "12345678900"
normalizarCpf('12345678900');       // "12345678900"
normalizarCpf('');                  // ""
normalizarCpf(null);                // ""
```

### Exemplo 4: Verificação de Tipo Especial

```typescript
import { isTipoEspecial } from '@/backend/captura/services/partes/identificacao-partes.service';

isTipoEspecial('PERITO');                    // true
isTipoEspecial('perito');                    // true (case-insensitive)
isTipoEspecial('PERITO_CONTADOR');          // true
isTipoEspecial('MINISTERIO_PUBLICO');       // true
isTipoEspecial('AUTOR');                     // false
isTipoEspecial('REU');                       // false
isTipoEspecial('');                          // false
```

## Testes

### Testes Unitários (78 testes, 100% passing)

```bash
# Executar testes de identificação
npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
```

**Cobertura de testes**:
- ✅ `normalizarCpf()` - 6 testes
- ✅ `isTipoEspecial()` - 11 testes
- ✅ `identificarTipoParte()` validações - 3 testes
- ✅ `identificarTipoParte()` tipos especiais - 4 testes
- ✅ `identificarTipoParte()` cliente - 6 testes
- ✅ `identificarTipoParte()` parte contrária - 4 testes
- ✅ `identificarTipoParte()` edge cases - 5 testes

### Teste de Integração API PJE

```bash
# Testar API real do PJE (requer credenciais)
npx tsx dev_data/scripts/test-pje-partes-api.ts
```

**Configuração necessária** em `dev_data/scripts/test-pje-partes-api.ts`:
```typescript
const CONFIG_TESTE = {
  credencialId: 1,              // ID da credencial no banco
  idProcesso: 0,                // ⚠️ AJUSTAR! ID PJE do processo
  trt: 5,                       // TRT do processo
  timeout: 60000,
};
```

**O que o teste verifica**:
- Autenticação no PJE com 2FA
- Busca de partes via `obterPartesProcesso()`
- Busca de representantes via `obterRepresentantesPartePorID()`
- Formatação correta dos dados retornados

## Estrutura de Dados

### Tabelas Afetadas

1. **clientes** - Partes representadas pelo escritório
2. **partes_contrarias** - Partes opostas
3. **terceiros** - Partes especiais (peritos, MP, etc.)
4. **representantes** - Advogados e representantes das partes
5. **enderecos** - Endereços (tabela polimórfica)
6. **processo_partes** - Vínculos many-to-many processo ↔ partes

### Relacionamentos

```
acervo (processos)
   │
   │ 1:N
   ▼
processo_partes (vínculo)
   │
   │ N:1
   ├──► clientes
   ├──► partes_contrarias
   └──► terceiros
        │
        │ 1:N
        ▼
   representantes
        │
        │ 1:1
        ▼
   enderecos (polimórfico)
```

### Upsert por id_pessoa_pje

Todas as entidades (clientes, partes_contrarias, terceiros, representantes, enderecos) usam **upsert por id_pessoa_pje** (ou id_pje para endereços):

- **ON CONFLICT**: Se `id_pessoa_pje` já existe, atualiza os dados
- **INSERT**: Se não existe, cria novo registro
- **Vantagem**: Evita duplicatas ao recapturar mesmo processo

## Performance

### Métricas Típicas

| Cenário | Partes | Representantes | Duração | Observações |
|---------|--------|----------------|---------|-------------|
| Processo simples | 2 | 2 | 1.5-2s | Autor + Réu com 1 advogado cada |
| Processo médio | 4 | 6 | 2-3s | Múltiplas partes e advogados |
| Processo complexo | 10+ | 15+ | 4-6s | Litisconsórcio, assistentes, peritos |

### Otimizações

- ✅ Partes processadas sequencialmente (evita race conditions)
- ✅ Representantes salvos em lote por parte
- ✅ Upsert usa índices de id_pessoa_pje (performance de lookup)
- ✅ Logs com console.log (assíncrono, não bloqueia)
- ⚠️ API PJE pode ser lenta (depende do tribunal)

## Troubleshooting

### Problema: Todas as partes sendo classificadas como parte_contraria

**Causa**: CPF do advogado não está cadastrado corretamente ou representantes não têm CPF

**Solução**:
1. Verificar CPF do advogado no banco: `SELECT id, nome, cpf FROM advogados WHERE id = X`
2. Verificar se representantes têm CPF no PJE
3. Adicionar logs para debug:
```typescript
console.log('CPF advogado:', advogado.cpf);
console.log('CPF representante:', representante.numeroDocumento);
```

### Problema: Perito sendo classificado como cliente

**Causa**: Tipo não está na lista TIPOS_ESPECIAIS ou tem formatação diferente

**Solução**:
1. Verificar `tipoParte` retornado pelo PJE
2. Adicionar novo tipo à lista em `identificacao-partes.service.ts`:
```typescript
const TIPOS_ESPECIAIS = [
  // ...
  'NOVO_TIPO_PERITO',
];
```

### Problema: Erro "Parte e advogado são obrigatórios"

**Causa**: Parâmetros null/undefined sendo passados

**Solução**:
```typescript
// ✅ Correto
const advogado = {
  id: 1,
  cpf: '123.456.789-00',
};

// ❌ Incorreto
const advogado = null;
```

### Problema: Duplicatas de clientes/partes

**Causa**: Upsert por id_pessoa_pje não está funcionando (chave duplicada ou índice ausente)

**Solução**:
1. Verificar constraint UNIQUE em id_pessoa_pje:
```sql
-- Deve ter constraint UNIQUE
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clientes' AND constraint_type = 'UNIQUE';
```

2. Verificar migrações aplicadas:
```bash
npx supabase db remote commit
```

### Problema: Performance lenta (>10s por processo)

**Causa**: Muitas queries ao banco ou API PJE lenta

**Solução**:
1. Verificar logs do banco (query lenta)
2. Verificar latência da API PJE (timeout)
3. Considerar aumentar timeout:
```typescript
const resultado = await capturarPartesProcesso(page, processo, advogado);
// Se timeout, aumentar SCRAPING_TIMEOUT em .env.local
```

## Logs e Debugging

### Níveis de Log

```typescript
// INFO - Operações normais
console.log('[CAPTURA-PARTES] Iniciando captura...');

// WARNING - Situações incomuns mas não fatais
console.warn('[IDENTIFICACAO] Parte sem representantes');

// ERROR - Falhas que requerem atenção
console.error('[CAPTURA-PARTES] Erro ao processar parte:', error);

// DEBUG - Informações detalhadas (comentar em produção)
console.debug('[IDENTIFICACAO] CPF do representante não corresponde');
```

### Exemplo de Logs Completos

```
[CAPTURA-PARTES] Iniciando captura de partes do processo 0001234-56.2024.5.03.0001 (ID: 123)
[CAPTURA-PARTES] Encontradas 3 partes no processo 0001234-56.2024.5.03.0001
[CAPTURA-PARTES] Processando parte 1/3: MARIA SANTOS
[IDENTIFICACAO] Parte "MARIA SANTOS" (AUTOR) identificada como CLIENTE (representada por Dr. João Silva - 12345/MG)
[CAPTURA-PARTES] Processando parte 2/3: EMPRESA XYZ LTDA
[IDENTIFICACAO] Parte "EMPRESA XYZ LTDA" identificada como PARTE_CONTRARIA (2 representantes, nenhum do escritório)
[CAPTURA-PARTES] Processando parte 3/3: JOSÉ PERITO
[IDENTIFICACAO] Parte "JOSÉ PERITO" (PERITO) identificada como TERCEIRO (tipo especial)
[CAPTURA-PARTES] Captura concluída para processo 0001234-56.2024.5.03.0001: Clientes: 1, Partes Contrárias: 1, Terceiros: 1, Representantes: 5, Vínculos: 3, Erros: 0, Tempo: 2500ms
```

## Manutenção

### Adicionar Novo Tipo Especial

1. Editar `identificacao-partes.service.ts`:
```typescript
const TIPOS_ESPECIAIS = [
  // ... tipos existentes
  'NOVO_TIPO',
] as const;
```

2. Adicionar teste em `__tests__/identificacao-partes.test.ts`:
```typescript
it('deve identificar NOVO_TIPO como terceiro', () => {
  const parte = createParteMock({
    tipoParte: 'NOVO_TIPO',
    representantes: [],
  });
  expect(identificarTipoParte(parte, mockAdvogado)).toBe('terceiro');
});
```

3. Executar testes:
```bash
npx tsx backend/captura/services/partes/__tests__/identificacao-partes.test.ts
```

### Modificar Algoritmo de Identificação

⚠️ **CUIDADO**: Mudanças no algoritmo afetam classificação de todos os processos

**Processo recomendado**:
1. Adicionar testes para novo comportamento
2. Modificar função
3. Executar todos os 78 testes
4. Testar em processos reais no ambiente de dev
5. Documentar mudança em `tasks.md` da OpenSpec

## Referências

- **PJE-TRT API**: [`backend/api/pje-trt/partes/`](../../../api/pje-trt/partes/)
- **Persistence Services**:
  - Clientes: [`backend/clientes/services/persistence/`](../../../clientes/services/persistence/)
  - Partes Contrárias: [`backend/partes-contrarias/services/persistence/`](../../../partes-contrarias/services/persistence/)
  - Terceiros: [`backend/terceiros/services/persistence/`](../../../terceiros/services/persistence/)
  - Representantes: [`backend/representantes/services/`](../../../representantes/services/)
  - Endereços: [`backend/enderecos/services/`](../../../enderecos/services/)
- **Vínculo Processo-Partes**: [`backend/processo-partes/services/persistence/`](../../../processo-partes/services/persistence/)
- **OpenSpec Change**: [`openspec/changes/captura-partes-pje/`](../../../../openspec/changes/captura-partes-pje/)

---

**Última atualização**: 2025-11-24
**Versão do módulo**: 1.0.0
**Autor**: Sistema Sinesys - Zattar Advogados
