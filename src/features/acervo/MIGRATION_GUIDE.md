# Guia de Migração - Feature Acervo

## 📋 Resumo das Mudanças

A feature `acervo` passou por uma refatoração completa alinhada ao **Feature-Sliced Design (FSD)**, melhorando type safety, separação de responsabilidades e eliminando dependências de `backend/`.

---

## 🎯 Principais Mudanças

### 1. Métodos de Serviço Específicos

**Antes (Polimórfico - DEPRECATED):**

```typescript
import { obterAcervo } from "@/features/acervo/service";

// Retorno ambíguo: ListarAcervoResult | ListarAcervoAgrupadoResult | ListarAcervoUnificadoResult
const result = await obterAcervo({ unified: true, agrupar_por: "trt" });

// Type guard necessário
if ("agrupamentos" in result) {
  // É agrupado
} else if ("processos" in result) {
  const processos = result.processos;
  // Processos pode ser Acervo[] OU ProcessoUnificado[]
  const isAcervo = "grau" in processos[0]; // Type guard manual
}
```

**Agora (Específico - RECOMENDADO):**

```typescript
import {
  obterAcervoPaginado,
  obterAcervoUnificado,
  obterAcervoAgrupado,
} from "@/features/acervo";

// ✅ Retorno explícito: ListarAcervoResult (sempre Acervo[])
const paginado = await obterAcervoPaginado({ pagina: 1, limite: 50 });
console.log(paginado.processos[0].grau); // ✅ OK - tipo Acervo

// ✅ Retorno explícito: ListarAcervoUnificadoResult (sempre ProcessoUnificado[])
const unificado = await obterAcervoUnificado({ pagina: 1 });
console.log(unificado.processos[0].instancias); // ✅ OK

// ✅ Retorno explícito: ListarAcervoAgrupadoResult
const agrupado = await obterAcervoAgrupado({ agrupar_por: "trt" });
console.log(agrupado.agrupamentos); // ✅ OK
```

---

### 2. Exportação de Timeline Unificada

**Antes:**

```typescript
import { obterTimelineUnificadaPorId } from "@/features/acervo/timeline-unificada";
```

**Agora:**

```typescript
import {
  obterTimelineUnificada,
  obterTimelineUnificadaPorId,
  type TimelineItemUnificado,
  type TimelineUnificada,
} from "@/features/acervo";
```

---

### 3. Tipos de Timeline

**Antes:**

```typescript
import type { TimelineItemEnriquecido } from "@/lib/api/pje-trt/types";
```

**Agora:**

```typescript
import type { TimelineItemEnriquecido } from "@/lib/api/pje-trt/types";
// OU
import type { TimelineItemEnriquecido } from "@/features/acervo/types";
```

---

## 📊 Tabela de Migração Rápida

| Caso de Uso                     | Antes                                  | Agora                                         |
| ------------------------------- | -------------------------------------- | --------------------------------------------- |
| **Listar instâncias separadas** | `obterAcervo({ unified: false })`      | `obterAcervoPaginado({ ... })`                |
| **Listar processos unificados** | `obterAcervo({ unified: true })`       | `obterAcervoUnificado({ ... })`               |
| **Agrupar por campo**           | `obterAcervo({ agrupar_por: 'trt' })`  | `obterAcervoAgrupado({ agrupar_por: 'trt' })` |
| **Exportar CSV**                | Usar `actionExportarAcervoCSV()`       | ✅ Já migrado automaticamente                 |
| **Timeline unificada**          | `src/features/acervo/timeline-unificada` | `@/features/acervo`                         |

---

## 🔧 Casos de Uso Detalhados

### Caso 1: Tabela de Acervo (Instâncias Separadas)

```typescript
// ✅ CORRETO - Tipo forte garantido
import { obterAcervoPaginado } from "@/features/acervo";

const { processos, total, pagina } = await obterAcervoPaginado({
  pagina: 1,
  limite: 50,
  trt: "TRT3",
  responsavel_id: userId,
});

// processos é sempre Acervo[] - sem type guards necessários
processos.forEach((p) => {
  console.log(p.grau); // ✅ sempre disponível
  console.log(p.origem); // ✅ sempre disponível
  console.log(p.status); // ✅ sempre disponível
});
```

### Caso 2: Dashboard com Processos Unificados

```typescript
// ✅ CORRETO - ProcessoUnificado[] garantido
import { obterAcervoUnificado } from "@/features/acervo";

const { processos } = await obterAcervoUnificado({
  pagina: 1,
  limite: 20,
});

// processos é sempre ProcessoUnificado[]
processos.forEach((p) => {
  console.log(p.numero_processo); // ✅ OK
  console.log(p.instancias.primeiro_grau); // ✅ OK
  console.log(p.instancias.segundo_grau); // ✅ OK
  // p.grau // ❌ Erro TypeScript - não existe em ProcessoUnificado
});
```

### Caso 3: Gráfico de Agrupamento

```typescript
// ✅ CORRETO - Agrupamento explícito
import { obterAcervoAgrupado } from "@/features/acervo";

const { agrupamentos, total } = await obterAcervoAgrupado({
  agrupar_por: "trt",
  incluir_contagem: true,
});

agrupamentos.forEach((grupo) => {
  console.log(grupo.grupo); // 'TRT3', 'TRT5', etc
  console.log(grupo.quantidade); // Número de processos
});
```

### Caso 4: Exportação CSV

```typescript
// ✅ JÁ MIGRADO - Nenhuma ação necessária
import { actionExportarAcervoCSV } from "@/features/acervo";

const result = await actionExportarAcervoCSV({
  trt: "TRT3",
  origem: "acervo_geral",
});

// Retorna sempre Acervo[] (sem type guards)
console.log(result.data.csv); // ✅ Campos sempre presentes
```

---

## ⚠️ Breaking Changes

### 1. `obterAcervo()` marcado como `@deprecated`

```typescript
// ❌ DEPRECATED - Evitar em código novo
import { obterAcervo } from "@/features/acervo/service";

// ✅ Usar métodos específicos
import { obterAcervoPaginado, obterAcervoUnificado } from "@/features/acervo";
```

### 2. Imports de `backend/` não funcionam em `src/`

```typescript
// ❌ ESLint Error
import { obterTimelineUnificadaPorId } from "@/features/acervo/timeline-unificada";

// ✅ Usar feature
import { obterTimelineUnificadaPorId } from "@/features/acervo";
```

---

## 🧪 Testes

### Antes:

```typescript
import { obterAcervoPaginado } from "@/features/acervo";
```

### Agora:

```typescript
import { obterAcervoPaginado } from "@/features/acervo";
// OU
import { obterAcervoPaginado } from "@/features/acervo/service";
```

---

## 📦 Estrutura Atualizada

```
src/features/acervo/
├── components/          # Componentes React
├── actions/             # Server Actions
├── hooks/               # React Hooks
├── service.ts           # Casos de uso (com métodos específicos)
├── repository.ts        # Acesso a dados
├── domain.ts            # Entidades e regras
├── types.ts             # Tipos TypeScript
├── utils.ts             # Utilitários
├── timeline-unificada.ts # ✨ NOVO - Timeline agregada
└── index.ts             # Barrel exports
```

---

## 🎓 Boas Práticas

### ✅ DO:

- Use métodos específicos (`obterAcervoPaginado`, `obterAcervoUnificado`, `obterAcervoAgrupado`)
- Importe de `@/features/acervo` (barrel exports)
- Importe tipos de timeline de `@/lib/api/pje-trt/types`

### ❌ DON'T:

- Não use `obterAcervo()` genérico em código novo
- Não use imports legados em `src/` (use `@/features/acervo`)
- Não use type guards quando o tipo é garantido pelo método

---

## 🔄 Checklist de Migração

- [ ] Substituir `obterAcervo()` por método específico
- [ ] Remover type guards desnecessários (ex: `'grau' in processo`)
- [ ] Atualizar imports de `backend/acervo` → `features/acervo`
- [ ] Atualizar imports de timeline para `@/lib/api/pje-trt/types`
- [ ] Testar com TypeScript strict mode habilitado

---

## 📞 Suporte

Dúvidas sobre a migração? Verifique:

1. [README.md](./README.md) - Documentação completa da feature
2. [AGENTS.MD](../../../AGENTS.MD) - Guia arquitetural
3. Exemplos em `actions/acervo-actions.ts`

---

## 📅 Cronograma

- ✅ **Fase 1**: Criar métodos específicos (Completo)
- ✅ **Fase 2**: Migrar timeline unificada (Completo)
- ✅ **Fase 3**: Atualizar rotas API (Completo)
- 🔄 **Fase 4**: Migrar código existente (Em andamento)
- 📅 **Fase 5**: Remover `backend/acervo/` (Futuro)
