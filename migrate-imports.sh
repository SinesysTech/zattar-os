#!/bin/bash

# Script para migrar imports de @/app/_lib para os locais corretos na arquitetura FSD

echo "Iniciando migração de imports..."

# Hooks para features específicas
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/hooks/use-acervo|@/features/acervo|g" \
  -e "s|@/app/_lib/hooks/use-audiencias|@/features/audiencias|g" \
  -e "s|@/app/_lib/hooks/use-usuarios|@/features/usuarios|g" \
  -e "s|@/app/_lib/hooks/use-obrigacoes|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-contas-pagar|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-contas-receber|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-orcamentos|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-plano-contas|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-conciliacao-bancaria|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-contas-bancarias|@/features/financeiro|g" \
  -e "s|@/app/_lib/hooks/use-centros-custo|@/features/financeiro|g" \
  {} \;

# Hooks globais para @/hooks
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/hooks/use-mobile|@/hooks/use-breakpoint|g" \
  -e "s|@/app/_lib/hooks/use-mounted|@/hooks|g" \
  -e "s|@/app/_lib/hooks/use-is-touch-device|@/hooks|g" \
  {} \;

# Types para features ou @/types
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/types/audiencias|@/features/audiencias/types|g" \
  -e "s|@/app/_lib/types/credenciais|@/types|g" \
  -e "s|@/app/_lib/types/representantes|@/types|g" \
  -e "s|@/app/_lib/types/terceiros|@/types|g" \
  -e "s|@/app/_lib/types/tribunais|@/types|g" \
  {} \;

# Utilitários de assinatura digital
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/assinatura-digital/slug-helpers|@/features/assinatura-digital/utils/slug-helpers|g" \
  -e "s|@/app/_lib/assinatura-digital/formatters/cep|@/features/assinatura-digital/utils/formatters|g" \
  -e "s|@/app/_lib/assinatura-digital/formatters/cpf|@/features/assinatura-digital/utils/formatters|g" \
  -e "s|@/app/_lib/assinatura-digital/formatters/data|@/features/assinatura-digital/utils/formatters|g" \
  -e "s|@/app/_lib/assinatura-digital/formatters/telefone|@/features/assinatura-digital/utils/formatters|g" \
  -e "s|@/app/_lib/assinatura-digital/form-schema/schema-validator|@/features/assinatura-digital/utils|g" \
  -e "s|@/app/_lib/assinatura-digital/form-schema/zod-generator|@/features/assinatura-digital/utils|g" \
  -e "s|@/app/_lib/assinatura-digital/validations/business.validations|@/features/assinatura-digital/utils|g" \
  -e "s|@/app/_lib/assinatura-digital/validators/cpf.validator|@/features/assinatura-digital/utils|g" \
  {} \;

# Stores
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/stores/assinatura-digital/formulario-store|@/features/assinatura-digital/stores|g" \
  {} \;

# Outros utilitários
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|@/app/_lib/markdown-joiner-transform|@/lib/utils|g" \
  {} \;

# Remover hooks que não existem mais (use-minhas-permissoes, use-clientes, use-tipos-audiencias, use-tribunais)
# Estes precisarão ser tratados manualmente caso a caso

echo "Migração de imports concluída!"
echo ""
echo "ATENÇÃO: Os seguintes hooks não foram mapeados e precisam de verificação manual:"
echo "  - use-minhas-permissoes (verificar API de permissões)"
echo "  - use-clientes (verificar feature partes)"
echo "  - use-tipos-audiencias (verificar feature audiencias)"
echo "  - use-tribunais (verificar backend/types ou criar hook)"
