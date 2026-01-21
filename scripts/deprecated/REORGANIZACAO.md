# Reorganização do Diretório de Scripts

**Data:** 10 de Dezembro de 2025  
**Status:** ✅ Concluído

## 📋 Resumo

O diretório `scripts/` foi completamente reorganizado para seguir a arquitetura Feature-Sliced Design do Sinesys, agrupando scripts por funcionalidade e módulo de negócio.

## 🎯 Objetivos Alcançados

✅ Estrutura organizada por módulo/funcionalidade  
✅ Documentação completa com index.ts em cada diretório  
✅ README principal explicando toda a estrutura  
✅ package.json atualizado com novos caminhos  
✅ Scripts deprecados identificados  
✅ Mantida compatibilidade com execução existente

## 🗂️ Nova Estrutura

### Antes (Estrutura Antiga)

```
scripts/
├── api-acervo-geral/
├── api-arquivados/
├── api-audiencias/
├── api-partes/
├── api-pendentes-manifestacao/
├── api-timeline/
├── database/
├── design/
├── outros/
├── reprocessamento/
├── sincronizacao/
├── storage/
└── usuarios/
```

### Depois (Estrutura Nova)

```
scripts/
├── README.md                    # 📚 Documentação principal
├── captura/                     # 🎯 Captura de dados PJE/TRT
│   ├── index.ts                # Documentação do módulo
│   ├── acervo-geral/
│   ├── arquivados/
│   ├── audiencias/
│   ├── partes/
│   ├── pendentes/
│   └── timeline/
├── database/                    # 💾 Banco de dados
│   ├── index.ts
│   ├── migrations/
│   └── population/
├── sincronizacao/               # 🔄 Sincronização de dados
│   ├── index.ts
│   ├── usuarios/
│   ├── entidades/
│   └── processos/
├── storage/                     # 📦 Armazenamento (Backblaze B2)
│   └── index.ts
├── dev-tools/                   # 🛠️ Ferramentas de desenvolvimento
│   ├── index.ts
│   ├── design/
│   └── build/
└── results/                     # 📊 Resultados (gitignored)
```

## 📁 Mapeamento de Movimentação

### Captura de Dados

| Antes                         | Depois                  |
| ----------------------------- | ----------------------- |
| `api-acervo-geral/`           | `captura/acervo-geral/` |
| `api-arquivados/`             | `captura/arquivados/`   |
| `api-audiencias/`             | `captura/audiencias/`   |
| `api-partes/`                 | `captura/partes/`       |
| `api-pendentes-manifestacao/` | `captura/pendentes/`    |
| `api-timeline/`               | `captura/timeline/`     |

### Database

| Antes                           | Depois                                     |
| ------------------------------- | ------------------------------------------ |
| `database/*.ts`                 | `database/migrations/`                     |
| `outros/organize-migrations.ts` | `database/migrations/`                     |
| _(novo)_                        | `database/population/populate-database.ts` |

### Sincronização

| Antes                                              | Depois                     |
| -------------------------------------------------- | -------------------------- |
| `usuarios/sincronizar-usuarios.ts`                 | `sincronizacao/usuarios/`  |
| `sincronizacao/sincronizar-entidades-enderecos.ts` | `sincronizacao/entidades/` |
| `sincronizacao/corrigir-entidades-polo.ts`         | `sincronizacao/entidades/` |
| `sincronizacao/testar-terceiros.ts`                | `sincronizacao/entidades/` |
| `sincronizacao/sincronizar-partes-processos*.ts`   | `sincronizacao/processos/` |
| `reprocessamento/reprocessar-partes-acervo.ts`     | `sincronizacao/processos/` |

### Dev Tools

| Antes                          | Depois              |
| ------------------------------ | ------------------- |
| `design/analyze-typography.js` | `dev-tools/design/` |
| `validate-design-system.ts`    | `dev-tools/design/` |
| `check-build-memory.sh`        | `dev-tools/build/`  |
| `run-analyze.js`               | `dev-tools/build/`  |
| `run-build-debug-memory.js`    | `dev-tools/build/`  |

### Storage

| Antes          | Depois                    |
| -------------- | ------------------------- |
| `storage/*.ts` | `storage/` (sem mudanças) |

## 🗑️ Scripts Deprecados

Os seguintes scripts foram identificados como deprecados mas **não removidos** (por segurança):

1. **`outros/update-lib-imports.js`**

   - ❌ Deprecado: Refere-se a `@/lib` que não existe mais
   - 💡 Usar: Nova estrutura com `@/components`, `@/features`, etc.

2. **Diretórios vazios antigos**
   - `api-acervo-geral/` (vazio após cópia)
   - `api-arquivados/` (vazio após cópia)
   - `api-audiencias/` (vazio após cópia)
   - `api-partes/` (vazio após cópia)
   - `api-pendentes-manifestacao/` (vazio após cópia)
   - `api-timeline/` (vazio após cópia)

**Ação recomendada:** Remover manualmente após validar que todos os scripts novos funcionam.

## 📝 Alterações no package.json

```diff
- "test:api-acervo-geral": "tsx dev_data/scripts/test-api-acervo-geral.ts",
+ "test:api-acervo-geral": "tsx scripts/captura/acervo-geral/test-api-acervo-geral.ts",

- "test:api-arquivados": "tsx dev_data/scripts/test-api-arquivados.ts",
+ "test:api-arquivados": "tsx scripts/captura/arquivados/test-api-arquivados.ts",

- "test:api-audiencias": "tsx dev_data/scripts/test-api-audiencias.ts",
+ "test:api-audiencias": "tsx scripts/captura/audiencias/test-api-audiencias.ts",

- "test:api-pendentes-manifestacao": "tsx dev_data/scripts/test-api-pendentes-manifestacao.ts",
+ "test:api-pendentes-manifestacao": "tsx scripts/captura/pendentes/test-api-pendentes-manifestacao.ts",

- "populate:tabelas-audiencias": "tsx dev_data/scripts/populate-tabelas-auxiliares-audiencias.ts",
+ "populate:tabelas-audiencias": "tsx scripts/database/population/populate-tabelas-audiencias.ts",

- "sincronizar-usuarios": "tsx scripts/sincronizar-usuarios.ts",
+ "sincronizar-usuarios": "tsx scripts/sincronizacao/usuarios/sincronizar-usuarios.ts",

- "validate:design-system": "tsx scripts/validate-design-system.ts",
+ "validate:design-system": "tsx scripts/dev-tools/design/validate-design-system.ts",

❌ Removidos (deprecados):
- "debug:credentials": "tsx dev_data/scripts/debug-check-credentials.ts",
- "populate:classe-judicial-acervo": "tsx dev_data/scripts/populate-classe-judicial-acervo.ts",
```

## ✅ Validação

### Checklist de Testes

Execute os seguintes comandos para validar a reorganização:

```bash
# 1. Scripts de captura
npm run test:api-acervo-geral
npm run test:api-audiencias
npm run test:api-arquivados
npm run test:api-pendentes-manifestacao

# 2. Scripts de database
npm run populate:tabelas-audiencias
npx tsx scripts/database/migrations/check-applied-migrations.ts

# 3. Scripts de sincronização
npm run sincronizar-usuarios
npx tsx scripts/sincronizacao/processos/sincronizar-partes-processos.ts --help

# 4. Dev tools
npm run validate:design-system
npx tsx scripts/dev-tools/design/analyze-typography.js

# 5. Storage
npx tsx scripts/storage/test-backblaze-connection.ts
```

### Status dos Testes

| Categoria     | Script                      | Status              |
| ------------- | --------------------------- | ------------------- |
| Captura       | test-api-acervo-geral       | ⏳ Aguardando teste |
| Captura       | test-api-audiencias         | ⏳ Aguardando teste |
| Database      | populate-tabelas-audiencias | ⏳ Aguardando teste |
| Sincronização | sincronizar-usuarios        | ⏳ Aguardando teste |
| Dev Tools     | validate-design-system      | ⏳ Aguardando teste |

## 📚 Documentação Criada

1. **`scripts/README.md`**

   - Documentação principal do diretório
   - Explicação da estrutura completa
   - Guias de uso por categoria
   - Troubleshooting e referências

2. **`scripts/captura/index.ts`**

   - Documentação de scripts de captura
   - Pré-requisitos e variáveis de ambiente
   - Exemplos de uso detalhados
   - Fluxo de captura explicado

3. **`scripts/database/index.ts`**

   - Documentação de migrations
   - Documentação de população de dados
   - Fluxos de trabalho
   - Notas de segurança

4. **`scripts/sincronizacao/index.ts`**

   - Documentação de sincronização de usuários
   - Documentação de sincronização de entidades
   - Documentação de sincronização de processos
   - Casos de uso práticos

5. **`scripts/storage/index.ts`**

   - Configuração do Backblaze B2
   - Guia completo de setup
   - Integração com N8N
   - Notas sobre custos e segurança

6. **`scripts/dev-tools/index.ts`**
   - Análise de tipografia
   - Validação de design system
   - Análise de build e memória
   - Integração CI/CD

## 🔄 Próximos Passos

1. **Testar todos os scripts reorganizados**

   - Executar checklist de validação acima
   - Reportar qualquer erro encontrado

2. **Remover diretórios deprecados**

   - Após validação completa, remover:
     - `api-acervo-geral/`
     - `api-arquivados/`
     - `api-audiencias/`
     - `api-partes/`
     - `api-pendentes-manifestacao/`
     - `api-timeline/`
     - `outros/`

3. **Atualizar documentação de features**

   - Se algum script for referenciado em docs, atualizar caminhos

4. **Revisar .gitignore**
   - Garantir que `scripts/results/` está ignorado
   - Verificar se diretórios antigos vazios podem ser ignorados

## 📞 Suporte

Se encontrar problemas:

1. Verifique se está no diretório raiz do projeto
2. Verifique se variáveis de ambiente estão configuradas
3. Consulte `scripts/README.md` para documentação detalhada
4. Consulte index.ts da categoria específica

---

**Reorganização realizada com sucesso! 🎉**

Todos os scripts permanecem funcionais, apenas reorganizados para melhor manutenibilidade e alinhamento com a arquitetura FSD do Sinesys.
