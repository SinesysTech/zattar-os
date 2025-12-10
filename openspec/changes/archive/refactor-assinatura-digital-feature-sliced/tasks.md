# Tasks: Refactor Assinatura Digital Module

## Phase 1: Create New Structure ✅

- [x] Criar diretório `src/features/assinatura-digital/`
- [x] Criar `types/domain.ts` com tipos de entidades (Segmento, Template, Formulario, DynamicFormSchema)
- [x] Criar `types/api.ts` com tipos de API (payloads, responses, records)
- [x] Criar `types/store.ts` com tipos do Zustand store
- [x] Criar `types/index.ts` barrel export
- [x] Criar `constants/estados-civis.ts`
- [x] Criar `constants/nacionalidades.ts`
- [x] Criar `constants/termos.ts`
- [x] Criar `constants/step-config.ts`
- [x] Criar `constants/api-routes.ts`
- [x] Criar `constants/index.ts` barrel export
- [x] Criar `utils/formatters.ts` (CPF, CNPJ, telefone, CEP, data)
- [x] Criar `utils/validators.ts` (CPF, CNPJ, telefone, CEP, email)
- [x] Criar `utils/device-fingerprint.ts`
- [x] Criar `utils/index.ts` barrel export
- [x] Criar `store/formulario-store.ts`
- [x] Criar `store/index.ts` barrel export
- [x] Criar `repository.ts`
- [x] Criar `service.ts`
- [x] Criar `index.ts` barrel export principal
- [x] Validar compilação TypeScript

## Phase 2: Update Imports (TODO)

- [ ] Atualizar imports em `src/app/(dashboard)/assinatura-digital/templates/`
- [ ] Atualizar imports em `src/app/(dashboard)/assinatura-digital/formularios/`
- [ ] Atualizar imports em `src/app/(dashboard)/assinatura-digital/segmentos/`
- [ ] Atualizar imports em `src/app/(dashboard)/assinatura-digital/assinatura/`
- [ ] Atualizar imports em `src/app/formulario/[segmento]/[formulario]/`
- [ ] Atualizar imports em `src/components/assinatura-digital/`
- [ ] Atualizar imports em `src/app/api/assinatura-digital/`

## Phase 3: Migrate Components (TODO)

- [ ] Migrar `src/components/assinatura-digital/form/` → `src/features/assinatura-digital/components/form/`
- [ ] Migrar `src/components/assinatura-digital/editor/` → `src/features/assinatura-digital/components/editor/`
- [ ] Migrar `src/components/assinatura-digital/schema-builder/` → `src/features/assinatura-digital/components/schema-builder/`
- [ ] Migrar `src/components/assinatura-digital/signature/` → `src/features/assinatura-digital/components/signature/`
- [ ] Migrar `src/components/assinatura-digital/capture/` → `src/features/assinatura-digital/components/capture/`
- [ ] Migrar `src/components/assinatura-digital/pdf/` → `src/features/assinatura-digital/components/pdf/`
- [ ] Migrar `src/components/assinatura-digital/inputs/` → `src/features/assinatura-digital/components/inputs/`

## Phase 4: Test & Cleanup (TODO)

- [ ] Testar fluxo completo de assinatura digital
- [ ] Testar admin de templates
- [ ] Testar admin de formulários
- [ ] Testar admin de segmentos
- [ ] Remover `src/core/assinatura-digital/`
- [ ] Remover `src/app/_lib/assinatura-digital/`
- [ ] Remover `src/app/_lib/stores/assinatura-digital/`
- [ ] Remover `src/types/assinatura-digital/`
- [ ] Remover componentes legados de `src/components/assinatura-digital/`
