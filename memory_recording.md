# Project Sinesys - Status & Structure

## Status (Jan 2026)
- **Active Features:** acervo, advogados, ai, processos, usuarios, etc.
- **Partial:** audiencias, documentos, partes.
- **Planned:** tasks, financeiro, calendar.
- **Security:** Processos module fixed (auth check + RLS).
- **Tech Stack:** Next.js 16, React 19, Supabase, Tailwind 4.

## Documentation
- **Source of Truth:** AGENTS.md is the most up-to-date file.
- **Modules:**  contains generated READMEs per feature.
- **Legacy:** Old reports moved to .

## Key Patterns
- **Feature-Sliced Design:**
- **Safe Actions:**  wrapper or manual .
- **Database:** Supabase with RLS.
