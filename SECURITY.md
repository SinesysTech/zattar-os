# Relatório de Segurança - Dependências

## Status Atual

### Vulnerabilidades Conhecidas

#### XLSX (High Severity)
- **Pacote**: `xlsx@0.18.5`
- **Vulnerabilidades**:
  1. Prototype Pollution ([GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6))
  2. Regular Expression Denial of Service - ReDoS ([GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9))
- **Status**: Não há correção disponível no npm
- **Versão Atual**: 0.18.5 (última versão disponível no npm)
- **Mitigação**:
  - Usar apenas com arquivos confiáveis
  - Validar entrada antes de processar
  - Considerar migração para biblioteca alternativa (ex: `exceljs` já está instalada)

### Correções Aplicadas

#### 1. Conflitos de Peer Dependencies (Resolvido ✅)
- **Problema**: `@excalidraw/excalidraw@0.16.4` requer React 17 ou 18, mas o projeto usa React 19
- **Solução**: Adicionado override no package.json para forçar React 19
```json
"@platejs/excalidraw": {
  "@excalidraw/excalidraw": {
    "react": "$react",
    "react-dom": "$react-dom"
  }
}
```

#### 2. PrismJS (Resolvido ✅)
- **Problema**: Versão antiga com vulnerabilidade de DOM Clobbering
- **Solução**: Adicionado override para versão segura
```json
"prismjs": "^1.30.0"
```

#### 3. Node.js Engine Warning (Resolvido ✅)
- **Problema**: Requeria Node >=24.11.1, mas versão instalada era 24.9.0
- **Solução**: Atualizado para `>=24.9.0` para compatibilidade

## Recomendações

### Curto Prazo
- Monitorar atualizações da biblioteca `xlsx`
- Revisar uso da biblioteca `xlsx` e considerar migração para `exceljs`

### Longo Prazo
- Migrar completamente para `exceljs` (já disponível no projeto)
- Implementar validação rigorosa de arquivos Excel antes do processamento
- Configurar CI/CD para alertas automáticos de vulnerabilidades

## Comandos Úteis

```bash
# Verificar vulnerabilidades
npm audit

# Verificar vulnerabilidades com detalhes
npm audit --json

# Listar pacotes desatualizados
npm outdated
```

---

**Última atualização**: 2025-12-26
