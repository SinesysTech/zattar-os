# Assinatura Digital - Feature Module

## Visão Geral

Módulo completo de assinatura digital eletrônica com conformidade legal MP 2.200-2/2001. Suporta dois fluxos principais:

1. **Fluxo Documentos**: Upload de PDF + links públicos por assinante
2. **Fluxo Templates**: Templates + Formulários dinâmicos (simulador/preview)

## Estrutura do Módulo

```
src/features/assinatura-digital/
├── domain.ts                           # Tipos base, schemas Zod, entidades
├── actions/                            # Server actions
│   ├── documentos-actions.ts
│   ├── templates-actions.ts
│   └── index.ts
├── services/                           # Lógica de negócio
│   ├── documentos.service.ts          # Serviço do fluxo documentos
│   ├── templates.service.ts
│   ├── formularios.service.ts
│   ├── signature.service.ts           # Serviço do fluxo templates
│   └── ...
├── components/                         # Componentes React
│   ├── assinatura-digital-tabs-content.tsx
│   ├── assinatura-fluxo-form.tsx
│   └── ...
├── __tests__/                          # Testes
│   ├── e2e/
│   │   ├── documento-flow.spec.ts     # Teste E2E completo
│   │   └── formsign.spec.ts
│   ├── integration/
│   └── unit/
├── types/                              # Tipos TypeScript
└── index.ts                            # Exports públicos
```

## Fluxo Principal: Upload de PDF com Links Públicos

### 1. Administrador Cria Documento

**Página:** `/assinatura-digital?tab=documentos`

**Steps:**
1. Upload de PDF
2. Configuração (título, selfie obrigatória/opcional)
3. Seleção de assinantes (clientes, partes contrárias, representantes, terceiros, usuários, convidados)
4. Editor visual de âncoras (desenhar retângulos no PDF)
5. Geração de links públicos únicos por assinante

**Server Action:**
```typescript
import { actionCreateDocumento } from '@/features/assinatura-digital';

const result = await actionCreateDocumento({
  titulo: "Contrato de Prestação de Serviços",
  selfie_habilitada: true,
  pdf_original_url: "https://storage.../original.pdf",
  hash_original_sha256: "abc123...",
  created_by: 1,
  assinantes: [
    {
      assinante_tipo: "cliente",
      assinante_entidade_id: 10,
    },
    {
      assinante_tipo: "convidado",
      dados_snapshot: {
        nome_completo: "João Silva",
        email: "joao@example.com",
      },
    },
  ],
});
```

### 2. Assinante Acessa Link Público

**URL:** `/assinatura/{token}`

**Steps:**
1. **Identificação**: Confirmar/preencher dados (nome, CPF, email, telefone)
2. **Selfie** (se habilitada): Captura via webcam
3. **Assinatura**: Desenhar no canvas (replicada em todas as âncoras de assinatura)
4. **Rubrica** (se necessária): Desenhar no canvas (replicada em todas as âncoras de rubrica)
5. **Termos**: Aceitar termos MP 2.200-2
6. **Finalização**: Upload de artefatos, geração do PDF final, download

**Características:**
- Token opaco de 64 caracteres (não enumerável)
- Sem expiração temporal
- Bloqueio one-time (não reutilizável após conclusão)
- Metadados de segurança coletados automaticamente (IP, user-agent, geolocalização, fingerprint)

### 3. Geração do PDF Final

O sistema:
1. Carrega o PDF original
2. Para cada assinante concluído:
   - Aplica assinatura em todas as âncoras de tipo "assinatura"
   - Aplica rubrica em todas as âncoras de tipo "rubrica"
3. Calcula hash SHA-256 do PDF final
4. Faz upload para storage (Backblaze B2)
5. Marca documento como "concluído" quando todos assinantes finalizarem

## Schemas Zod (Validação)

### Criar Documento

```typescript
import { createAssinaturaDigitalDocumentoSchema } from '@/features/assinatura-digital';

const validated = createAssinaturaDigitalDocumentoSchema.parse({
  titulo: "Meu Documento",
  selfie_habilitada: false,
  pdf_original_url: "https://...",
  assinantes: [
    { assinante_tipo: "cliente", assinante_entidade_id: 1 },
  ],
});
```

### Definir Âncoras

```typescript
import { upsertAssinaturaDigitalDocumentoAncoraSchema } from '@/features/assinatura-digital';

const ancoras = [
  {
    documento_assinante_id: 1,
    tipo: "assinatura",
    pagina: 1,
    x_norm: 0.1,  // Coordenadas normalizadas (0..1)
    y_norm: 0.8,
    w_norm: 0.3,
    h_norm: 0.1,
  },
  {
    documento_assinante_id: 1,
    tipo: "rubrica",
    pagina: 1,
    x_norm: 0.1,
    y_norm: 0.5,
    w_norm: 0.15,
    h_norm: 0.05,
  },
];
```

## Tipos TypeScript

### Documento

```typescript
import type { AssinaturaDigitalDocumento } from '@/features/assinatura-digital';

const documento: AssinaturaDigitalDocumento = {
  id: 1,
  documento_uuid: "abc-123",
  titulo: "Contrato",
  status: "pronto", // rascunho | pronto | concluido | cancelado
  selfie_habilitada: true,
  pdf_original_url: "https://...",
  pdf_final_url: null, // Preenchido após todos assinarem
  hash_original_sha256: "abc123...",
  hash_final_sha256: null,
  created_by: 1,
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-05T10:00:00Z",
};
```

### Assinante

```typescript
import type { AssinaturaDigitalDocumentoAssinante } from '@/features/assinatura-digital';

const assinante: AssinaturaDigitalDocumentoAssinante = {
  id: 1,
  documento_id: 1,
  assinante_tipo: "cliente", // cliente | parte_contraria | representante | terceiro | usuario | convidado
  assinante_entidade_id: 10,
  dados_snapshot: {
    entidade_id: 10,
    nome_completo: "João Silva",
    cpf: "12345678901",
    email: "joao@example.com",
    telefone: "11987654321",
  },
  dados_confirmados: true,
  token: "abc123...", // Token opaco de 64 chars
  status: "concluido", // pendente | concluido
  selfie_url: "https://storage.../selfie.jpg",
  assinatura_url: "https://storage.../assinatura.png",
  rubrica_url: "https://storage.../rubrica.png",
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  geolocation: { latitude: -23.5, longitude: -46.6, accuracy: 50 },
  termos_aceite_versao: "v1.0-MP2200-2",
  termos_aceite_data: "2026-01-05T11:00:00Z",
  dispositivo_fingerprint_raw: { /* ... */ },
  concluido_em: "2026-01-05T11:00:00Z",
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-05T11:00:00Z",
};
```

## Conformidade Legal (MP 2.200-2)

O sistema implementa **Assinatura Eletrônica Avançada** conforme Art. 10, § 2º da MP 2.200-2/2001:

### Requisitos Atendidos

- **a) Associação unívoca**: Fingerprint do dispositivo (screen resolution, canvas hash, WebGL hash, timezone, etc.)
- **b) Criação sob controle exclusivo**: Captura em tempo real via webcam/canvas, sem upload de arquivos
- **c) Integridade**: Hash SHA-256 do PDF pré e pós assinatura
- **d) Vinculação ao documento**: Manifesto embedado no PDF final com todos os metadados

### Metadados Coletados

- IP Address
- User Agent
- Geolocalização (com consentimento)
- Timestamp preciso
- Fingerprint completo do dispositivo
- Hash SHA-256 (original e final)
- Versão dos termos aceitos
- Data/hora do aceite

### Auditoria

```typescript
import { auditSignatureIntegrity } from '@/features/assinatura-digital';

const auditResult = await auditSignatureIntegrity(assinaturaId);

console.log(auditResult);
// {
//   assinatura_id: 1,
//   protocolo: "FS-20260105-00001",
//   status: "valido",
//   hashes_validos: true,
//   hash_original_registrado: "abc123...",
//   hash_final_recalculado: "abc123...",
//   entropia_suficiente: true,
//   avisos: [],
//   erros: [],
//   auditado_em: "2026-01-05T12:00:00Z"
// }
```

## Storage (Backblaze B2)

### Estrutura de Pastas

```
assinatura-digital/
├── documentos/
│   └── {documento_uuid}/
│       ├── original.pdf
│       ├── final.pdf
│       └── assinantes/
│           └── {assinante_id}/
│               ├── selfie.jpg
│               ├── assinatura.png
│               └── rubrica.png
└── templates/
    └── {template_uuid}/
        └── template.pdf
```

## Navegação

### URL Principal
`/assinatura-digital` → Redireciona para `/assinatura-digital?tab=documentos`

### Tabs Disponíveis
- `?tab=documentos` - Enviar PDF (fluxo principal)
- `?tab=templates` - Gerenciar templates
- `?tab=formularios` - Gerenciar formulários

### Rota de Templates
`/assinatura-digital/assinatura` - Fluxo de templates com formulários dinâmicos

## Testes

### E2E Tests

```bash
npm run test:e2e -- documento-flow.spec.ts
```

**Cobertura:**
- Criação de documento completo
- Seleção de assinantes (entidades + convidados)
- Upload de PDF
- Definição de âncoras
- Validação de links públicos
- Fluxo do assinante (identificação → selfie → assinatura → rubrica → termos)
- Bloqueio de reuso de link
- Download do PDF final

### Integration Tests

```bash
npm test -- --testPathPattern=assinatura-digital
```

### Unit Tests

```bash
npm test -- assinatura-digital.service.test.ts
```

## Permissões

### Admin
- Criar/listar/editar documentos: `assinatura_digital`
- Gerenciar templates: `assinatura_digital`
- Gerenciar formulários: `assinatura_digital`

### Link Público
- Acesso via token opaco (sem autenticação)
- Validações: token válido, status pendente, não expirado

## Próximos Passos (Roadmap)

- [ ] Envio automático de links via email/WhatsApp
- [ ] Dashboard de acompanhamento de documentos
- [ ] Notificações em tempo real (Supabase Realtime)
- [ ] Bulk upload de múltiplos PDFs
- [ ] Preview do PDF final antes de finalizar
- [ ] Histórico/audit trail completo
- [ ] Integração com webhooks externos (n8n)
- [ ] Assinatura com certificado digital ICP-Brasil (opcional)

## Suporte

Para dúvidas ou problemas, consulte:
- `docs/assinatura-digital/conformidade-legal.md` - Detalhes de conformidade legal
- `openspec/changes/add-formsign-pdf-upload-links/` - Especificação da change proposal
- `src/features/assinatura-digital/__tests__/` - Exemplos de uso nos testes
