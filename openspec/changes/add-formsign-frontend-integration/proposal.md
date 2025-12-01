# Change: Integrar interfaces do Formsign ao frontend Sinesis

## Why
Trazer as páginas de gestão e execução do Formsign para dentro do Sinesis usando o design system atual, evitando manter frontend separado.

## What Changes
- Migrar telas de administração de templates/formulários/segmentos de assinatura para o Sinesis
- Criar fluxos de assinatura (preview/finalizar) no frontend integrado, consumindo as novas APIs
- Usar componentes do shadcn (já presentes) e reaproveitar partes do Formsign apenas onde necessário

## Impact
- Affected specs: formsign-frontend
- Affected code: app/(routes) de admin e fluxo de assinatura; componentes UI compartilhados
