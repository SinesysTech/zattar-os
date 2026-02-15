# Padrão de Badges para Partes Processuais

## 📋 Visão Geral

Este documento estabelece o **padrão obrigatório** para renderização de partes processuais (Autor/Réu, Reclamante/Reclamado) em todas as visualizações do sistema.

## ⚠️ Regra Obrigatória

**SEMPRE** que você for exibir nomes de partes processuais em tabelas, listas ou cards, você **DEVE** usar o componente `ParteBadge`.

### ❌ NÃO FAÇA

```tsx
// ❌ Cores hardcoded com AppBadge
<AppBadge className="bg-blue-100 text-blue-700">
  {nomeAutor}
</AppBadge>

// ❌ Badge genérico sem polo
<Badge>{nomeAutor}</Badge>

// ❌ SemanticBadge diretamente
<SemanticBadge category="polo" value="ATIVO">
  {nomeAutor}
</SemanticBadge>

// ❌ Span ou div com estilos manuais
<span className="bg-red-100 px-2 py-1">{nomeReu}</span>

// ❌ Texto simples sem badge
<div>{nomeAutor}</div>
```

### ✅ FAÇA

```tsx
import { ParteBadge } from '@/components/ui/parte-badge';

// ✅ Use ParteBadge com polo especificado
<ParteBadge polo="ATIVO">{nomeAutor}</ParteBadge>
<ParteBadge polo="PASSIVO">{nomeReu}</ParteBadge>

// ✅ Ou use os componentes auxiliares
import { ParteAutorBadge, ParteReuBadge } from '@/components/ui/parte-badge';

<ParteAutorBadge>{nomeAutor}</ParteAutorBadge>
<ParteReuBadge>{nomeReu}</ParteReuBadge>
```

## 🎨 Padrão Visual

- **Polo ATIVO** (Reclamante/Autor): Badge azul (info) com fundo forte
- **Polo PASSIVO** (Reclamado/Réu): Badge vermelho (destructive) com fundo forte
- **Tom padrão**: Solid (fundo forte, conforme Design System)
- **Sem contorno**: Variante soft não utiliza contorno

## 📦 Componente ParteBadge

### Localização

```
src/components/ui/parte-badge.tsx
```

### Props

```typescript
interface ParteBadgeProps {
  /** Polo processual da parte */
  polo: 'ATIVO' | 'PASSIVO' | 'AUTOR' | 'REU' | 'RECLAMANTE' | 'RECLAMADO';

  /** Nome da parte a ser exibido */
  children: React.ReactNode;

  /** Se true, trunca o texto e mostra tooltip */
  truncate?: boolean;

  /** Largura máxima quando truncate=true */
  maxWidth?: string;

  /** Classes CSS adicionais */
  className?: string;
}
```

### Uso Básico

```tsx
import { ParteBadge } from '@/components/ui/parte-badge';

function ProcessoCard({ processo }) {
  return (
    <div>
      <ParteBadge polo="ATIVO">
        {processo.nomeParteAutora || '-'}
      </ParteBadge>
      <ParteBadge polo="PASSIVO">
        {processo.nomeParteRe || '-'}
      </ParteBadge>
    </div>
  );
}
```

### Com Truncamento

```tsx
<ParteBadge polo="ATIVO" truncate maxWidth="200px">
  {processo.nomeParteAutora || '-'}
</ParteBadge>
```

### Componentes Auxiliares

Para maior conveniência, use os componentes pré-configurados:

```tsx
import { ParteAutorBadge, ParteReuBadge } from '@/components/ui/parte-badge';

// Pré-configurado para polo ATIVO
<ParteAutorBadge>
  {processo.nomeParteAutora}
</ParteAutorBadge>

// Pré-configurado para polo PASSIVO
<ParteReuBadge>
  {processo.nomeParteRe}
</ParteReuBadge>
```

## 📍 Implementação Atual

### ✅ Páginas que seguem o padrão:

1. **Processos** ([src/features/processos/components/processos-table-wrapper.tsx](../../src/features/processos/components/processos-table-wrapper.tsx))
   - Coluna "Partes" usa `ParteBadge`
   - Fonte da verdade: `nomeParteAutoraOrigem` / `nomeParteReOrigem`

2. **Audiências** ([src/features/audiencias/components/audiencias-list-columns.tsx](../../src/features/audiencias/components/audiencias-list-columns.tsx))
   - Coluna "Processo" inclui partes com `ParteBadge`
   - Fonte da verdade: `poloAtivoOrigem` / `poloPassivoOrigem`

3. **Expedientes** ([src/features/expedientes/components/columns.tsx](../../src/features/expedientes/components/columns.tsx))
   - Coluna "Processo" inclui partes com `ParteBadge`
   - Fonte da verdade: `nomeParteAutoraOrigem` / `nomeParteReOrigem`
   - Mostra contador `+N` quando há múltiplas partes

4. **Perícias** ([src/features/pericias/components/columns.tsx](../../src/features/pericias/components/columns.tsx))
   - Coluna "Processo" inclui partes com `ParteBadge`
   - Fonte da verdade: `processo.nomeParteAutoraOrigem` / `processo.nomeParteReOrigem`

## 🔍 Fonte da Verdade - Campos "Origem"

**IMPORTANTE**: Sempre priorize os campos com sufixo `Origem` ao exibir nomes de partes:

```tsx
// ✅ Correto - Usa campos "origem" primeiro
const nomeAutor = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
const nomeReu = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
```

### Por quê?

- Campos "origem" preservam os nomes do **1º grau** (tribunal de origem)
- Em recursos (2º grau, TST), o polo processual pode inverter
- Quem recorre vira polo ativo no recurso, mas continua sendo réu
- Os campos "origem" garantem a verdade sobre quem é autor e quem é réu

## 🎯 Exemplo Completo - Coluna de Processo

Padrão recomendado para colunas de processo em tabelas:

```tsx
{
  id: 'processo',
  accessorKey: 'numeroProcesso',
  header: 'Processo',
  cell: ({ row }) => {
    const p = row.original;

    // Fonte da verdade: sempre usar campos "origem"
    const nomeAutor = p.nomeParteAutoraOrigem || p.nomeParteAutora || '-';
    const nomeReu = p.nomeParteReOrigem || p.nomeParteRe || '-';

    return (
      <div className="flex flex-col gap-1 items-start leading-relaxed">
        {/* Linha 1: Tribunal + Grau */}
        <TribunalGrauBadge trt={p.trt} grau={p.grau} />

        {/* Linha 2: Número do processo */}
        <span className="text-xs font-bold">
          {p.numeroProcesso}
        </span>

        {/* Linha 3: Órgão julgador */}
        <span className="text-xs text-muted-foreground">
          {p.descricaoOrgaoJulgador}
        </span>

        {/* Partes com badges de polo */}
        <div className="flex flex-col gap-0.5">
          {/* Polo Ativo (Autor) */}
          <div className="flex items-center gap-1 text-xs">
            <ParteBadge polo="ATIVO" className="text-xs px-1.5 py-0">
              {nomeAutor}
            </ParteBadge>
            {(p.qtdeParteAutora ?? 0) > 1 && (
              <span className="text-xs text-muted-foreground">
                +{(p.qtdeParteAutora ?? 0) - 1}
              </span>
            )}
          </div>

          {/* Polo Passivo (Réu) */}
          <div className="flex items-center gap-1 text-xs">
            <ParteBadge polo="PASSIVO" className="text-xs px-1.5 py-0">
              {nomeReu}
            </ParteBadge>
            {(p.qtdeParteRe ?? 0) > 1 && (
              <span className="text-xs text-muted-foreground">
                +{(p.qtdeParteRe ?? 0) - 1}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
}
```

## 🚨 Checklist de Implementação

Ao criar ou modificar uma visualização com partes processuais:

- [ ] Importei `ParteBadge` de `@/components/ui/parte-badge`?
- [ ] Estou usando `ParteBadge` ao invés de `AppBadge`, `Badge` ou `SemanticBadge` diretamente?
- [ ] Especifiquei o polo corretamente (`ATIVO` ou `PASSIVO`)?
- [ ] Priorizei campos com sufixo "Origem" quando disponíveis?
- [ ] Mantive a classe `text-xs px-1.5 py-0` para consistência visual?
- [ ] Adicionei estrutura de contador `+N` se houver múltiplas partes?

## 🔗 Links Relacionados

- [Design System Principal](./design-system/README.md)
- [Página de Demonstração](/design-system) - Veja os badges em ação
- [Componente SemanticBadge](../../src/components/ui/semantic-badge.tsx)
- [Design System Variants](../../src/lib/design-system/variants.ts)

## 📝 Notas para Desenvolvedores

- Este componente usa `SemanticBadge` internamente com `category="polo"`
- O tom padrão é `solid` (fundo forte), conforme definido no Design System
- Em caso de dúvida, consulte este documento ou a página `/design-system`
- Novos desenvolvedores: **leia este documento antes de criar visualizações de processos**

---

**Última atualização**: Janeiro 2026
**Mantido por**: Equipe de Desenvolvimento Zattar
