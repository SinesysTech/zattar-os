# Zattar Advogados - Supabase Database Schema Export

> **Complete schema export of the Zattar Advogados (Sinesys) database**
>
> Generated: February 10, 2026 | PostgreSQL 15.x | Supabase

---

## 🎯 What is This?

This directory contains a **complete export of the database schema** for the Zattar Advogados application, including:

- 103 tables
- 40+ custom ENUM types
- 400+ indexes
- 50+ functions
- 100+ triggers
- 100+ RLS policies
- 3 views
- 10 PostgreSQL extensions

Use these files to **recreate the database structure** in a new Supabase project.

---

## 🚀 Quick Start (5 minutes)

### For the Impatient Developer

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to your NEW project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# 3. Pull schema from CURRENT project (temporarily)
# (Update connection to current project)
supabase db pull

# 4. Push to NEW project
supabase db push

# Done! ✨
```

**Need more details?** → Read **[`QUICK_START.md`](./QUICK_START.md)**

---

## 📚 Documentation Structure

### Start Here 👇

| File | Purpose | Read Time |
|------|---------|-----------|
| **[`INDEX.md`](./INDEX.md)** | Overview of all files | 2 min |
| **[`QUICK_START.md`](./QUICK_START.md)** ⚡ | Fast migration guide | 5 min |
| **[`SCHEMA_EXPORT_README.md`](./SCHEMA_EXPORT_README.md)** ⭐ | Complete documentation | 15 min |

### For Detailed Work 🛠️

| File | Purpose |
|------|---------|
| **[`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)** ✅ | Step-by-step checklist |
| **[`useful_queries.sql`](./useful_queries.sql)** | 14 ready-to-use SQL queries |
| **[`COMMANDS_REFERENCE.sh`](./COMMANDS_REFERENCE.sh)** | Bash commands reference |
| **[`full_schema_dump.sql`](./full_schema_dump.sql)** | Template SQL file |

---

## 🎓 Which File Should I Read?

### "I just want to migrate quickly"
→ **[`QUICK_START.md`](./QUICK_START.md)**

### "I need detailed instructions"
→ **[`SCHEMA_EXPORT_README.md`](./SCHEMA_EXPORT_README.md)**

### "I want to track my progress"
→ **[`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)**

### "I need specific SQL queries"
→ **[`useful_queries.sql`](./useful_queries.sql)**

### "I want bash commands"
→ **[`COMMANDS_REFERENCE.sh`](./COMMANDS_REFERENCE.sh)**

### "I want an overview of everything"
→ **[`INDEX.md`](./INDEX.md)**

---

## 💡 Common Scenarios

### Scenario 1: Creating a Staging Database
```bash
# Use Supabase CLI
supabase link --project-ref STAGING_PROJECT_REF
supabase db push
```

### Scenario 2: Disaster Recovery
```bash
# Use pg_dump backup
psql "$NEW_DATABASE_URL" < zattar_backup.sql
```

### Scenario 3: Specific Object Export
```sql
-- Execute query from useful_queries.sql
-- Example: Get all functions
SELECT pg_get_functiondef(p.oid) FROM pg_proc p...
```

### Scenario 4: Manual Table-by-Table
```sql
-- Execute query #6 from useful_queries.sql
-- Get CREATE TABLE statements for all tables
```

---

## ⚡ Features of This Export

### ✅ What's Included
- Complete table definitions with columns, types, defaults, nullability
- All ENUM types (codigo_tribunal, grau_tribunal, etc.)
- Primary keys, foreign keys, unique constraints, check constraints
- 400+ performance indexes
- Views (audiencias_com_origem, expedientes_com_origem, repasses_pendentes)
- Functions (assignment, status updates, notifications, utilities)
- Triggers (auto-assignment, logging, notifications, timestamps)
- RLS policies (service_role, authenticated, owner-based access)
- Extensions (vector, pg_trgm, uuid-ossp, etc.)

### ⚠️ What's NOT Included
- Actual data (use pg_dump --data-only)
- Storage bucket files
- Auth provider configs
- Edge Functions
- Environment variables

---

## 🏗️ Database Architecture

### Core Modules

```
┌─────────────────────────────────────────────┐
│         PROCESS MANAGEMENT                  │
│  acervo · audiencias · expedientes          │
│  pericias · comunica_cnj                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         PARTIES & CONTACTS                  │
│  clientes · partes_contrarias               │
│  representantes · terceiros                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         CONTRACTS & FINANCIAL               │
│  contratos · acordos_condenacoes            │
│  lancamentos_financeiros · parcelas         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         DOCUMENTS & COMMUNICATION           │
│  documentos · arquivos · pecas_modelos      │
│  mensagens_chat · salas_chat                │
└─────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

### Required Tools
- **Supabase CLI** - `npm install -g supabase`
- **Node.js** - v18 or higher
- **psql** - PostgreSQL client
- **Git** - For version control

### Access Required
- Connection to current Supabase project
- Admin access to new Supabase project
- Database credentials (if using pg_dump)

---

## ⏱️ Time Estimates

| Method | Schema Only | With Data |
|--------|------------|-----------|
| **Supabase CLI** | 10-15 min | +30-60 min |
| **Manual SQL** | 1-2 hours | +30-60 min |
| **pg_dump** | 15-30 min | +30-60 min |

---

## 🎯 Success Criteria

After migration, verify:

✅ 103 tables created
✅ 40+ ENUMs exist
✅ 400+ indexes created
✅ Functions execute without errors
✅ Triggers fire correctly
✅ RLS policies enforce security
✅ Application connects successfully
✅ Can read and write data
✅ File uploads work

---

## 📊 Schema Statistics

```
Database: Zattar Advogados (Sinesys)
PostgreSQL Version: 15.x
Supabase Version: Latest stable

Objects:
├── Extensions:     10
├── ENUMs:          40+
├── Tables:         103
├── Views:          3
├── Functions:      50+
├── Triggers:       100+
├── Indexes:        400+
└── RLS Policies:   100+

Approximate Size:
├── Schema DDL:     ~2 MB
├── Functions:      ~500 KB
└── Complete:       ~3 MB (without data)
```

---

## 🆘 Support & Resources

### Documentation
- 📖 [Supabase Docs](https://supabase.com/docs)
- 📖 [PostgreSQL Docs](https://www.postgresql.org/docs/)
- 📖 [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

### Community
- 💬 [Supabase Discord](https://discord.supabase.com)
- 💬 [Supabase GitHub](https://github.com/supabase/supabase)

### Internal
- 📄 See all `.md` files in this directory
- 💻 See `useful_queries.sql` for SQL examples
- 🔧 See `COMMANDS_REFERENCE.sh` for bash commands

---

## ⚠️ Important Warnings

### Before Migration
1. ✅ **Always backup** current database
2. ✅ **Test in staging** first
3. ✅ **Have rollback plan** ready
4. ✅ **Notify team** of maintenance window
5. ✅ **Update DNS/routing** after verification

### After Migration
1. ⚠️ **Monitor logs** for 24 hours
2. ⚠️ **Verify all features** work
3. ⚠️ **Check performance** metrics
4. ⚠️ **Update documentation** if needed
5. ⚠️ **Keep old database** as backup for 30 days

---

## 🎓 Learning Path

### For Beginners
1. Read [`QUICK_START.md`](./QUICK_START.md)
2. Execute CLI commands
3. Verify with simple queries

### For Intermediate
1. Read [`SCHEMA_EXPORT_README.md`](./SCHEMA_EXPORT_README.md)
2. Understand schema structure
3. Execute queries from [`useful_queries.sql`](./useful_queries.sql)

### For Advanced
1. Review complete documentation
2. Customize migration for specific needs
3. Optimize performance post-migration
4. Implement monitoring and alerts

---

## 🔐 Security Considerations

- **RLS Policies**: All tables have Row Level Security enabled
- **Service Role**: Use with caution (bypasses RLS)
- **Anon Key**: Public, safe for client-side
- **Credentials**: Never commit to git
- **Storage**: Configure bucket policies carefully

---

## 🚀 Next Steps

### 1. Choose Your Method
- **Fastest**: Supabase CLI (10 minutes)
- **Most Control**: Manual SQL (2 hours)
- **Most Flexible**: pg_dump (30 minutes)

### 2. Read Documentation
- Start with [`QUICK_START.md`](./QUICK_START.md)
- Or deep dive into [`SCHEMA_EXPORT_README.md`](./SCHEMA_EXPORT_README.md)

### 3. Execute Migration
- Follow [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)
- Use commands from [`COMMANDS_REFERENCE.sh`](./COMMANDS_REFERENCE.sh)

### 4. Verify & Configure
- Run verification queries
- Configure storage and auth
- Update application configs

### 5. Go Live
- Test thoroughly
- Monitor closely
- Celebrate! 🎉

---

## 📝 Version

**Export Version**: 1.0
**Export Date**: 2026-02-10
**Database**: Zattar Advogados (Sinesys)
**PostgreSQL**: 15.x
**Supabase**: Latest stable
**Next.js**: 16+ (Turbopack)

---

## 👨‍💻 Generated By

**Claude Code** (Anthropic)
Assisted by: Zattar Advogados Development Team

---

## 📄 License

Proprietary to Zattar Advogados (Sinesys)
Not for public distribution

---

**Ready to start?** → Open **[`QUICK_START.md`](./QUICK_START.md)** →

---

## 📞 Questions?

Review the documentation files in order:
1. [`INDEX.md`](./INDEX.md) - Overview
2. [`QUICK_START.md`](./QUICK_START.md) - Fast track
3. [`SCHEMA_EXPORT_README.md`](./SCHEMA_EXPORT_README.md) - Complete guide

Still stuck? Check the troubleshooting section in [`QUICK_START.md`](./QUICK_START.md).

---

**Last Updated**: 2026-02-10
