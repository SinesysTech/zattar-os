# Build Optimization Guide

Este documento descreve o sistema de monitoramento e otimizacao de performance de build do projeto.

## Visao Geral

O projeto possui um sistema completo de monitoramento de build que inclui:

- **Analise de Performance**: Medicao de tempo de build, tamanho de bundle e estatisticas de cache
- **Validacao de Thresholds**: Verificacao automatica contra limites configurados
- **Dashboard Interativo**: Visualizacao de metricas e tendencias ao longo do tempo
- **Integracao CI/CD**: Relatorios automaticos em Pull Requests

### Metricas Monitoradas

| Metrica | Threshold | Descricao |
|---------|-----------|-----------|
| Main Chunk | 500KB | Tamanho do chunk principal da aplicacao |
| Total Size | 5MB | Tamanho total de todos os chunks JS |
| Chunk Count | 50 | Numero maximo de chunks |
| Build Time | 10min | Tempo maximo de build |
| Cache Hit Rate | 70% | Taxa minima de acerto do cache |
| Single Chunk | 1MB | Tamanho maximo de um chunk individual |

## Scripts Disponiveis

### Analise de Build

```bash
# Executa build completo com analise de performance
npm run analyze:build-performance

# Gera visualizacao interativa do bundle
npm run analyze:bundle

# Gera dashboard HTML com historico
npm run generate:build-dashboard
```

### Validacao

```bash
# Valida thresholds (modo warn - padrao)
npm run validate:build-performance

# Valida thresholds (modo strict - falha se exceder)
npm run validate:build-performance:strict

# Valida thresholds (modo warn explicitamente)
npm run validate:build-performance:warn
```

### Outros

```bash
# Valida cache do build
npm run validate:cache

# Analise de bundle existente
npm run analyze
```

## Interpretando Resultados

### Relatorio JSON

O script `analyze:build-performance` gera um arquivo JSON em `scripts/results/build-performance/latest.json`:

```json
{
  "timestamp": "2026-01-08T12:00:00.000Z",
  "phases": {
    "nextjs": {
      "duration": 180000,
      "percentage": 100
    }
  },
  "total": {
    "duration": 180000
  },
  "bundle": {
    "totalSize": 5242880,
    "mainChunk": 512000,
    "chunkCount": 42,
    "largestChunks": [...]
  },
  "cache": {
    "hitRate": 0.85,
    "entries": 1234,
    "size": 104857600
  },
  "delta": {
    "duration": { "absolute": -5000, "percentage": -2.7, "improved": true },
    "bundleSize": { "absolute": 10240, "percentage": 0.2, "improved": false }
  }
}
```

### Bundle Analyzer

Execute `npm run analyze:bundle` para gerar uma visualizacao interativa do bundle. O arquivo HTML sera gerado em `scripts/results/bundle-analysis/`.

A visualizacao mostra:
- Tamanho de cada modulo/pacote
- Dependencias entre modulos
- Oportunidades de code splitting

### Dashboard

Execute `npm run generate:build-dashboard` para gerar um dashboard HTML com graficos de tendencias. O arquivo sera salvo em `scripts/results/build-performance/dashboard.html`.

O dashboard inclui:
- Grafico de tempo de build ao longo do tempo
- Grafico de tamanho do bundle
- Distribuicao de chunks
- Cache hit rate
- Tabela dos maiores chunks

## Otimizacoes Implementadas

### Turbopack vs Webpack

- **Desenvolvimento**: Turbopack (mais rapido para HMR)
- **Producao**: Webpack com PWA (necessario para service worker)

### Lazy Loading

Componentes pesados sao carregados sob demanda:

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});
```

### Code Splitting Estrategico

O Next.js automaticamente faz code splitting por rota. Para otimizar ainda mais:

```tsx
// Lazy load de componentes condicionais
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false
});
```

### Modularize Imports

Configurado no `next.config.ts` para reduzir bundle em 20-30%:

```typescript
modularizeImports: {
  'lucide-react': {
    transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
  },
  'date-fns': {
    transform: 'date-fns/{{member}}',
  },
}
```

### Optimize Package Imports

Pacotes grandes com tree-shaking otimizado:

```typescript
experimental: {
  optimizePackageImports: [
    'date-fns',
    'lucide-react',
    'recharts',
    'framer-motion',
    // ... Radix UI, Plate.js
  ],
}
```

### Cache Persistente

O projeto usa um cache handler customizado para persistir cache entre builds:

```typescript
experimental: {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // Desabilita cache em memoria, usa apenas disco
}
```

## Troubleshooting

### Build Lento

1. **Verificar cache**: Execute `npm run validate:cache` para verificar se o cache esta funcionando
2. **Dependencias**: Verifique se pacotes grandes estao sendo tree-shaked corretamente
3. **TypeScript**: Execute `tsc --noEmit` para verificar se ha erros de tipo que atrasam o build

```bash
# Verificar cache
npm run validate:cache

# Build com logs detalhados
npm run build:verbose
```

### Bundle Grande

1. **Identificar chunks pesados**: Use `npm run analyze:bundle` para visualizar
2. **Lazy loading**: Mova componentes pesados para lazy loading
3. **Dependencias**: Verifique se ha dependencias duplicadas ou desnecessarias

```bash
# Analise visual do bundle
npm run analyze:bundle

# Validar tamanhos
npm run validate:build-performance
```

### Cache Nao Funcionando

1. **Verificar handler**: Certifique-se que `cache-handler.js` existe
2. **Permissoes**: Verifique permissoes da pasta `.next/cache`
3. **Ambiente**: O cache handler so funciona em producao (`NODE_ENV=production`)

```bash
# Limpar cache e rebuildar
rm -rf .next
npm run build
```

## CI/CD Integration

### GitHub Actions Workflow

O workflow `bundle-size.yml` executa automaticamente em:
- Push para `main`, `master`, `develop`
- Pull Requests

O workflow:
1. Executa build com analise de performance
2. Valida thresholds
3. Gera relatorio de bundle size
4. Comenta no PR com metricas
5. Faz upload de artifacts

### Interpretando Comentarios em PRs

O bot adiciona um comentario com formato:

```markdown
# Bundle Size Report

## Metricas Gerais
| Metrica | Valor |
|---------|-------|
| Tamanho Total | X.XX MB |
| Main Chunk | XXX KB |
| Numero de Chunks | XX |
| Tempo de Build | XXs |

## Top 5 Maiores Chunks
| Chunk | Tamanho |
|-------|---------|
| ... | ... |
```

### Acessando Artifacts

Os artifacts de build estao disponiveis por 30 dias e incluem:
- Relatorios de analise de bundle
- Historico de performance
- Dashboard HTML

## Historico de Otimizacoes

| Data | Otimizacao | Impacto |
|------|------------|---------|
| 2024-01 | Implementacao de modularizeImports | -25% bundle size |
| 2024-02 | Cache handler customizado | -40% tempo de build |
| 2024-03 | Lazy loading de PDFViewer | -15% main chunk |
| 2024-04 | Otimizacao de Plate.js imports | -10% bundle size |

## Configuracao de Thresholds

Os thresholds podem ser ajustados em `scripts/validate-build-performance.js`:

```javascript
const THRESHOLDS = {
  mainChunk: 500 * 1024,      // 500KB
  totalSize: 5 * 1024 * 1024, // 5MB
  chunkCount: 50,
  buildTime: 10 * 60 * 1000,  // 10 min
  cacheHitRate: 0.7,          // 70%
  singleChunkMax: 1 * 1024 * 1024, // 1MB
};
```

## Boas Praticas

1. **Execute analise regularmente**: Apos grandes mudancas, execute `npm run analyze:bundle`
2. **Monitore tendencias**: Use o dashboard para identificar regressoes
3. **Revise PRs com atencao**: Verifique comentarios do bot sobre bundle size
4. **Otimize imports**: Use imports especificos ao inves de imports barrel
5. **Lazy load componentes pesados**: Especialmente PDFs, editores ricos, graficos complexos
