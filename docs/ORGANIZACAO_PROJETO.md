# Organização do Projeto - 2026-02-25

## ✅ Estado Atual da Organização

Este documento descreve a organização vigente da documentação e do código no repositório.

## 📁 Estrutura Atual

### Raiz do Projeto

```
/
├── README.md                   # Documentação principal
├── package.json                # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
├── next.config.ts             # Configuração Next.js
├── tailwind.config.ts         # Configuração Tailwind
├── .gitignore                  # Arquivos ignorados
├── LICENSE                    # Licença
├── docs/                      # 📚 Toda documentação
├── scripts/                   # 🔧 Todos os scripts
├── src/                       # 💻 Código fonte
├── supabase/                  # 🗄️ Migrations e schemas
└── [arquivos de configuração]
```

### Documentação Organizada

#### 📚 docs/

```
docs/
├── INDEX.md                   # Índice completo
├── README.md                  # Guia da documentação
├── ORGANIZACAO_PROJETO.md     # Este arquivo
│
├── architecture/              # Arquitetura
│   ├── AGENTS.md
│   ├── ARCHITECTURE.md
│   ├── CLAUDE.md
│   ├── STATUS.md
│   ├── DOCKER_BUILD_FIX.md
│   ├── DOCKER_OPTIMIZATION.md
│   └── DOCKER_OPTIMIZATION_QUICK.md
│
├── integrations/              # Integrações
│   ├── migration-guide.md
│   ├── QUICK_START_INTEGRACOES.md
│   ├── README_INTEGRACOES.md
│   ├── MIGRATION_INTEGRACOES_SUMMARY.md
│   └── SUCESSO_MIGRATION_INTEGRACOES.md
│
├── migrations/                # Migrations
│   ├── APPLY_MIGRATION.md
│   ├── SUPABASE_MIGRATION_SUMMARY.md
│   └── MIGRATION_DIFY_CHATFLOW.md
│
├── audits/                    # Auditorias
│   ├── AUDITORIA_TIPOS_SCHEMAS.md
│   ├── RELATORIO_CORRECOES_TIPOS.md
│   ├── RELATORIO_FINAL_AUDITORIA.md
│   ├── RELATORIO_FINAL_COMPLETO.md
│   └── RESUMO_AUDITORIA_FINAL.md
│
├── dify/                      # Dify AI
│   ├── DIFY_API_REFERENCE.md
│   ├── PLANO_CORRECAO_DIFY.md
│   ├── PROGRESSO_CORRECAO_DIFY.md
│   └── RELATORIO_FINAL_CORRECAO_DIFY.md
│
├── features/                  # Features
│   └── VERIFICACOES_ASSINATURA_DIGITAL.md
│
├── modules/                   # Documentação por módulo de negócio
├── troubleshooting/           # Troubleshooting público
├── configuracao/              # Guias de configuração
└── internal/                  # Segurança/deploy/guias internos
```

#### 🔧 scripts/

Os scripts estão organizados por domínio em subpastas (ex.: `ai/`, `captura/`, `database/`, `dev-tools/`, `docker/`, `integrations/`, `mcp/`, `security/`).

## 📊 Estatísticas

- `src/features`: 37 módulos
- `docs/modules`: 38 pastas de módulo + `README.md`
- Gap atual de documentação por módulo: 0 módulos sem pasta dedicada em `docs/modules`

## 🎯 Benefícios

1. ✅ Navegação centralizada por `docs/INDEX.md`
2. ✅ Separação entre documentação pública e interna (`docs/internal`)
3. ✅ Estrutura de scripts por domínio técnico
4. ✅ Índice de módulos para orientar FSD e documentação funcional
5. ✅ Base pronta para evolução incremental da documentação

## 📝 Convenções Estabelecidas

### Nomenclatura de Arquivos

- **UPPERCASE.md**: Relatórios e documentos de referência
- **lowercase.md**: Guias e tutoriais
- **kebab-case.md**: Documentação técnica

### Organização por Pasta

- **architecture/**: Design e estrutura do sistema
- **integrations/**: Guias de integrações externas
- **migrations/**: Documentação de migrations de banco
- **audits/**: Relatórios de auditoria e correções
- **dify/**: Específico para Dify AI
- **features/**: Documentação de features específicas
- **modules/**: documentação funcional por módulo
- **internal/**: documentação operacional/segurança/deploy

## 🔍 Como Encontrar Documentação

### Método 1: INDEX.md

Consulte `docs/INDEX.md` para lista completa e categorizada.

### Método 2: Busca por Categoria

```bash
# Arquitetura
ls docs/architecture/

# Integrações
ls docs/integrations/

# Migrations
ls docs/migrations/
```

### Método 3: Busca por Palavra-chave

```bash
# Buscar "integração" em toda documentação
grep -r "integração" docs/

# Buscar "migration" em toda documentação
grep -r "migration" docs/
```

## 🚀 Próximos Passos

1. Manter `docs/INDEX.md` sincronizado com novas páginas
2. Expandir READMEs dos módulos com maior uso operacional
3. Revisar semestralmente documentos históricos para arquivamento

## 📚 Links Úteis

- [Índice Completo](./INDEX.md)
- [README Documentação](./README.md)
- [Scripts de Integrações](../scripts/README_INTEGRATIONS.md)

---

**Data:** 2026-02-25  
**Ação:** Atualização de organização e consistência documental  
**Status:** ✅ Atualizado
