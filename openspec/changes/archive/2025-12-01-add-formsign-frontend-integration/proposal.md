# Change: Integrar interfaces da Assinatura Digital ao frontend Sinesis

## Why

Trazer as páginas de gestão e execução da Assinatura Digital para dentro do Sinesis usando o design system atual, evitando manter frontend separado.

## What Changes

- Migrar telas de administração de templates/formulários/segmentos de assinatura para o Sinesis
- Criar fluxos de assinatura (preview/finalizar) no frontend integrado, consumindo as novas APIs
- Usar componentes do shadcn (já presentes) e reaproveitar partes da Assinatura Digital apenas onde necessário

## Impact

- Affected specs: assinatura-digital-frontend
- Affected code: app/(routes) de admin e fluxo de assinatura; componentes UI compartilhados
