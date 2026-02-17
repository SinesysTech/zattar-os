#!/bin/bash
# ============================================================================
# Script: Verificar tamanho do contexto de build do Docker
# ============================================================================
# Mostra o tamanho total dos arquivos que serão enviados ao Docker daemon
# baseado no .dockerignore atual
# ============================================================================

set -e

echo "🔍 Verificando tamanho do contexto de build do Docker..."
echo ""

# Criar arquivo temporário com lista de arquivos
TEMP_FILE=$(mktemp)

# Usar docker build com --dry-run (se disponível) ou simular
echo "📊 Analisando arquivos incluídos no contexto..."
echo ""

# Contar arquivos que SERÃO incluídos (respeitando .dockerignore)
# Nota: Esta é uma estimativa, o docker build pode incluir/excluir mais
if command -v fd &> /dev/null; then
    # Usando fd (mais rápido e respeita .dockerignore)
    fd . --type f --hidden --exclude .git | wc -l | xargs echo "Arquivos incluídos (estimativa):"
    fd . --type f --hidden --exclude .git --exec-batch du -ch | tail -n 1 | awk '{print "Tamanho total:", $1}'
else
    # Fallback usando find
    find . -type f \
        ! -path "./.git/*" \
        ! -path "./node_modules/*" \
        ! -path "./.next/*" \
        ! -path "./docs/*" \
        ! -path "./scripts/*" \
        ! -path "./openspec/*" \
        ! -path "./.claude/*" \
        ! -path "./.vscode/*" \
        ! -path "./supabase/*" \
        ! -path "./docker/*" \
        ! -path "./.github/*" \
        ! -path "./design-system/*" \
        ! -name "*.md" \
        | wc -l | xargs echo "Arquivos incluídos (estimativa):"
    
    find . -type f \
        ! -path "./.git/*" \
        ! -path "./node_modules/*" \
        ! -path "./.next/*" \
        ! -path "./docs/*" \
        ! -path "./scripts/*" \
        ! -path "./openspec/*" \
        ! -path "./.claude/*" \
        ! -path "./.vscode/*" \
        ! -path "./supabase/*" \
        ! -path "./docker/*" \
        ! -path "./.github/*" \
        ! -path "./design-system/*" \
        ! -name "*.md" \
        -exec du -ch {} + | tail -n 1 | awk '{print "Tamanho total:", $1}'
fi

echo ""
echo "📦 Principais pastas incluídas:"
du -sh src/ 2>/dev/null || echo "src/: não encontrado"
du -sh public/ 2>/dev/null || echo "public/: não encontrado"
du -sh app/ 2>/dev/null || echo "app/: não encontrado"

echo ""
echo "🚫 Principais pastas EXCLUÍDAS (pelo .dockerignore):"
du -sh node_modules/ 2>/dev/null || echo "node_modules/: não encontrado"
du -sh .next/ 2>/dev/null || echo ".next/: não encontrado"
du -sh docs/ 2>/dev/null || echo "docs/: não encontrado"
du -sh scripts/ 2>/dev/null || echo "scripts/: não encontrado"
du -sh openspec/ 2>/dev/null || echo "openspec/: não encontrado"
du -sh .claude/ 2>/dev/null || echo ".claude/: não encontrado"
du -sh supabase/ 2>/dev/null || echo "supabase/: não encontrado"
du -sh design-system/ 2>/dev/null || echo "design-system/: não encontrado"
du -sh docker/ 2>/dev/null || echo "docker/: não encontrado"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Dica: O tamanho real pode variar. Para verificar exatamente:"
echo "   docker build --no-cache --progress=plain . 2>&1 | grep 'Sending build context'"
