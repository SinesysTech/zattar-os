# Proposal: add-representantes-backend

**Status**: draft
**Author**: Claude
**Created**: 2025-01-23

## Summary

Implement complete backend infrastructure for **representantes** (legal representatives) entity, which represents lawyers (advogados) who act on behalf of parties (clientes, partes_contrarias, terceiros) in legal processes captured from PJE-TRT API.

## Motivation

The PJE-TRT API returns a complex nested structure where each party can have multiple representatives (typically lawyers with OAB registration). Currently, the system captures parties but does NOT persist their representatives, losing critical relationship data needed for:

- Tracking which lawyers represent which parties in each process
- Managing lawyer contact information (email, phone, OAB)
- Maintaining accurate representation history per tribunal/grau context
- Supporting future features like automatic email notifications to opposing lawyers

## Goals

1. **Database Schema**: Create `representantes` table with 40+ fields matching PJE-TRT API structure
2. **Types**: Define TypeScript types for representantes with discriminated unions (PF/PJ)
3. **Persistence Service**: Implement CRUD operations with validation and deduplication
4. **API Routes**: Expose REST endpoints for representantes management
5. **Swagger Documentation**: Document all endpoints with OpenAPI annotations
6. **TRT/Grau Context**: Ensure representantes are scoped to tribunal and grau (primeiro_grau/segundo_grau)

## Non-Goals

- Frontend UI for representantes management (future work)
- Integration with external OAB validation APIs
- Automatic lawyer notification system

## Affected Systems

- **Database**: New table `representantes` with foreign keys to `clientes`, `partes_contrarias`, `terceiros`
- **Backend Types**: New module `backend/types/partes/representantes-types.ts`
- **Backend Services**: New service `backend/representantes/services/persistence/`
- **API Routes**: New routes `app/api/representantes/**`
- **Swagger**: Updated documentation at `/api/docs`

## Dependencies

- Requires completed partes refactor (terceiros, processo_partes tables)
- Requires snake_case API convention (already implemented)
- Requires discriminated union pattern (already established)

## Related Changes

- Builds on: `refactor-sistema-partes` (completed)
- Enables future: `representantes-frontend-ui`, `email-notifications-lawyers`

## Risks & Mitigation

**Risk**: Representantes can belong to multiple parties across different TRT/grau contexts
**Mitigation**: Use composite uniqueness constraint `(id_pessoa_pje, trt, grau, parte_id, parte_tipo)` + upsert pattern

**Risk**: OAB data may be invalid or incomplete from PJE
**Mitigation**: Store as-is from PJE, validate on frontend display only

**Risk**: Large data volume (many lawyers × many processes)
**Mitigation**: Add indexes on `id_pessoa_pje`, `trt`, `grau`, `parte_id`, `parte_tipo`, `numero_oab`

## Open Questions

None - design is straightforward based on PJE-TRT API structure.
