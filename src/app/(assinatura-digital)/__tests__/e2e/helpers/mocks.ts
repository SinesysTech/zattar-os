import { Page, Route } from '@playwright/test'

/**
 * Fixtures e helpers para mockar o fluxo público de assinatura digital.
 *
 * O fluxo vai direto do server component → page.tsx → consumers de API.
 * Os testes E2E rodam contra a aplicação Next.js real, mas as chamadas HTTP
 * são interceptadas via page.route() para retornar dados controlados.
 */

export type MockBehavior = 'success' | 'existing-client' | 'network-error'

export interface MockConfig {
  /** Comportamento geral do mock. */
  behavior?: MockBehavior
  /** Override específico do comportamento de verificar-cpf. */
  verificarCpf?: 'novo' | 'existente' | 'com-pendentes' | 'error'
  /** Override específico do comportamento de save-client. */
  saveClient?: 'success' | 'error'
}

export const FIXTURE_SEGMENTO_SLUG = 'tributario'
export const FIXTURE_FORMULARIO_SLUG = 'rescisao-trabalhista'

export const FIXTURE_CPF_NOVO = '11144477735'
export const FIXTURE_CPF_EXISTENTE = '98765432100'

export const FIXTURE_CLIENTE_EXISTENTE = {
  id: 42,
  nome: 'Maria Existente',
  cpf: FIXTURE_CPF_EXISTENTE,
  rg: '123456789',
  data_nascimento: '1985-03-15',
  estado_civil: '2',
  genero: '2',
  nacionalidade: '30',
  email: 'maria@example.com',
  celular: '11987654321',
  telefone: '1133334444',
  cep: '01310100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Apto 101',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
}

export const FIXTURE_FORMULARIO_SCHEMA = {
  sections: [
    {
      id: 'dados-acao',
      title: 'Dados da ação',
      fields: [
        {
          id: 'descricao',
          label: 'Descrição',
          type: 'text',
          required: true,
          validation: [{ type: 'required', message: 'Obrigatório' }],
        },
      ],
    },
  ],
}

export async function mockPublicFormularioPage(page: Page) {
  // Server-side rendering chama getSegmentoBySlug/getFormularioBySlugAndSegmentoId
  // diretamente no service (Supabase). Para E2E não atacamos o server component;
  // mockamos via API fetch routes que o client component chama depois do mount.

  await page.route('**/api/assinatura-digital/formularios/*', async (route: Route) => {
    const url = route.request().url()
    const id = url.split('/').pop()?.split('?')[0]
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: Number(id),
          formulario_uuid: 'fm-uuid',
          nome: 'Rescisão Trabalhista',
          slug: FIXTURE_FORMULARIO_SLUG,
          segmento_id: 1,
          form_schema: FIXTURE_FORMULARIO_SCHEMA,
          template_ids: ['tpl-1'],
          ativo: true,
          foto_necessaria: false,
          geolocation_necessaria: false,
          metadados_seguranca: '[]',
        },
      }),
    })
  })

  await page.route('**/api/assinatura-digital/formularios/*/schema', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FIXTURE_FORMULARIO_SCHEMA }),
    })
  })
}

export async function mockVerificarCpf(page: Page, cfg: MockConfig = {}) {
  await page.route('**/api/assinatura-digital/forms/verificar-cpf', async (route: Route) => {
    if (cfg.verificarCpf === 'error') {
      return route.fulfill({ status: 500, body: 'Server Error' })
    }

    const body = JSON.parse(route.request().postData() ?? '{}')
    const cpf = (body.cpf ?? '').replace(/\D/g, '')

    const existente = cpf === FIXTURE_CPF_EXISTENTE || cfg.verificarCpf === 'existente'

    if (existente) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exists: true,
          cliente: FIXTURE_CLIENTE_EXISTENTE,
          contratos_pendentes: [],
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ exists: false, cliente: null, contratos_pendentes: [] }),
    })
  })
}

export async function mockSaveClient(page: Page, cfg: MockConfig = {}) {
  await page.route('**/api/assinatura-digital/forms/save-client', async (route: Route) => {
    if (cfg.saveClient === 'error') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Falha ao salvar cliente' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { cliente_id: 99 } }),
    })
  })
}

export async function mockSalvarAcao(page: Page) {
  await page.route('**/api/assinatura-digital/signature/salvar-acao', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          contrato_id: 555,
          cliente_dados: { id: 99, nome: 'Cliente', cpf: FIXTURE_CPF_NOVO },
          parte_contraria_dados: [],
        },
      }),
    })
  })
}

export async function mockPreview(page: Page) {
  await page.route('**/api/assinatura-digital/signature/preview', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          pdf_url: 'https://fixtures.test/sample.pdf',
          template_id: 'tpl-1',
          gerado_em: new Date().toISOString(),
        },
      }),
    })
  })
}

export async function mockFinalize(page: Page) {
  await page.route('**/api/assinatura-digital/signature/finalizar', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          pdf_url: 'https://fixtures.test/final.pdf',
          protocolo: 'PROT-0001',
          assinatura_id: 7,
        },
      }),
    })
  })
}

export async function mockGetClientIp(page: Page) {
  await page.route('**/api/assinatura-digital/utils/get-client-ip', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { ip: '127.0.0.1', source: 'mock' },
      }),
    })
  })
}

export async function mockTemplate(page: Page) {
  await page.route('**/api/assinatura-digital/templates/*', async (route: Route) => {
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'tpl-1',
          nome: 'Contrato de Prestação',
          conteudo_markdown: '',
          versao: 1,
          status: 'ativo',
        },
      }),
    })
  })
}

/**
 * Instala todos os mocks do fluxo público numa única chamada.
 * Use overrides em `cfg` para simular erros ou comportamentos alternativos.
 */
export async function mockPublicFlow(page: Page, cfg: MockConfig = {}) {
  await mockPublicFormularioPage(page)
  await mockVerificarCpf(page, cfg)
  await mockSaveClient(page, cfg)
  await mockSalvarAcao(page)
  await mockPreview(page)
  await mockFinalize(page)
  await mockGetClientIp(page)
  await mockTemplate(page)
}

export function formularioUrl(segmento = FIXTURE_SEGMENTO_SLUG, formulario = FIXTURE_FORMULARIO_SLUG) {
  return `/formulario/${segmento}/${formulario}`
}
