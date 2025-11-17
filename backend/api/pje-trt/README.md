# APIs do PJE TRT

Este diretório contém as funções organizadas para interagir com as APIs REST do PJE (Processo Judicial Eletrônico) dos Tribunais Regionais do Trabalho (TRT).

## Estrutura

```
backend/api/pje-trt/
├── types.ts                    # Tipos, interfaces e enums compartilhados
├── fetch.ts                    # Função auxiliar para requisições HTTP
├── acervo-geral.ts            # APIs específicas para acervo geral
├── arquivados.ts              # APIs específicas para arquivados
├── pendentes-manifestacao.ts  # APIs específicas para pendentes de manifestação
├── audiencias.ts               # APIs específicas de audiências
└── README.md                   # Este arquivo
```

## Arquivos

### types.ts
Contém todas as definições de tipos TypeScript compartilhados:
- `PagedResponse<T>`: Interface para respostas paginadas
- `Totalizador`: Interface para totalizadores do painel
- `Processo`: Interface para processos retornados pela API
- `Audiencia`: Interface para audiências retornadas pela API
- `AgrupamentoProcessoTarefa`: Enum com tipos de agrupamento (ACERVO_GERAL=1, PENDENTES_MANIFESTACAO=2, ARQUIVADOS=5)

### fetch.ts
Função auxiliar genérica para fazer requisições HTTP GET à API do PJE:
- `fetchPJEAPI<T>()`: Função base usada por todas as outras funções de API
- Usa cookies de sessão para autenticação (não usa Authorization header)
- Executa requisições dentro do contexto do navegador Playwright

### acervo-geral.ts
APIs específicas para obter processos do Acervo Geral:
- `obterProcessosAcervoGeral()`: Retorna uma página específica de processos do acervo geral
- `obterTodosProcessosAcervoGeral()`: Retorna todas as páginas de processos do acervo geral
- `obterTotalizadoresAcervoGeral()`: Retorna o totalizador específico do acervo geral

### arquivados.ts
APIs específicas para obter processos Arquivados:
- `obterProcessosArquivados()`: Retorna uma página específica de processos arquivados
- `obterTodosProcessosArquivados()`: Retorna todas as páginas de processos arquivados

### pendentes-manifestacao.ts
APIs específicas para obter processos Pendentes de Manifestação:
- `obterProcessosPendentesManifestacao()`: Retorna uma página específica de processos pendentes
- `obterTodosProcessosPendentesManifestacao()`: Retorna todas as páginas de processos pendentes
- `obterTotalizadoresPendentesManifestacao()`: Retorna o totalizador específico de pendentes

### audiencias.ts
APIs específicas para obter audiências:
- `obterPautaAudiencias()`: Retorna uma página específica de audiências
- `obterTodasAudiencias()`: Retorna todas as páginas de audiências automaticamente

## Uso

### Importar tipos
```typescript
import type { Processo, Audiencia, AgrupamentoProcessoTarefa } from '@/backend/api/pje-trt/types';
```

### Importar funções de acervo geral
```typescript
import { 
  obterTodosProcessosAcervoGeral, 
  obterTotalizadoresAcervoGeral,
  AgrupamentoProcessoTarefa 
} from '@/backend/api/pje-trt/acervo-geral';
```

### Importar funções de arquivados
```typescript
import { 
  obterTodosProcessosArquivados,
  AgrupamentoProcessoTarefa 
} from '@/backend/api/pje-trt/arquivados';
```

### Importar funções de pendentes de manifestação
```typescript
import { 
  obterTodosProcessosPendentesManifestacao,
  obterTotalizadoresPendentesManifestacao,
  AgrupamentoProcessoTarefa 
} from '@/backend/api/pje-trt/pendentes-manifestacao';
```

### Importar funções de audiências
```typescript
import { obterTodasAudiencias } from '@/backend/api/pje-trt/audiencias';
```

## Exemplos

### Obter todos os processos do acervo geral
```typescript
import { obterTodosProcessosAcervoGeral } from '@/backend/api/pje-trt/acervo-geral';

const processos = await obterTodosProcessosAcervoGeral(page, idAdvogado);
```

### Obter todos os processos arquivados
```typescript
import { obterTodosProcessosArquivados } from '@/backend/api/pje-trt/arquivados';

const processos = await obterTodosProcessosArquivados(page, idAdvogado, 500, {
  tipoPainelAdvogado: 5,
  ordenacaoCrescente: false,
  data: Date.now()
});
```

### Obter todos os processos pendentes de manifestação
```typescript
import { obterTodosProcessosPendentesManifestacao } from '@/backend/api/pje-trt/pendentes-manifestacao';

const processos = await obterTodosProcessosPendentesManifestacao(page, idAdvogado, 500, {
  agrupadorExpediente: 'N',
  tipoPainelAdvogado: 2,
  idPainelAdvogadoEnum: 2,
  ordenacaoCrescente: false
});
```

### Obter todas as audiências de um período
```typescript
import { obterTodasAudiencias } from '@/backend/api/pje-trt/audiencias';

const audiencias = await obterTodasAudiencias(
  page,
  '2024-01-01',
  '2024-12-31',
  'M' // Marcadas/Designadas
);
```

## Documentação Detalhada

Cada arquivo contém documentação completa em português explicando:
- Propósito do arquivo
- Dependências e imports
- Exportações e quem as usa
- Para cada função: parâmetros, retorno, chamadas internas/externas, endpoint HTTP, comportamento especial
- Para cada tipo: campos, significado e uso

Consulte os comentários JSDoc em cada arquivo para informações detalhadas.

## Migração do arquivo antigo

Este diretório substitui o arquivo `backend/captura/services/trt/pje-api.service.ts`.

O arquivo antigo será mantido temporariamente até que todos os testes sejam concluídos e os imports atualizados.

