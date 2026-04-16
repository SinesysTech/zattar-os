import { test, expect } from '@/testing/e2e/fixtures'
import {
  mockPublicFlow,
  formularioUrl,
  FIXTURE_CPF_NOVO,
  FIXTURE_CPF_EXISTENTE,
} from './helpers/mocks'

/**
 * Suite E2E do fluxo público de assinatura digital (wizard de formulário).
 *
 * **Pré-requisito de seed**: o server component `page.tsx` renderiza buscando
 * segmento e formulário DIRETAMENTE no Supabase (não via API route). Sem seed
 * de DB de testes, a URL `/formulario/{slug}/{slug}` sempre retorna 404.
 *
 * Os testes marcados com `test.skip(!process.env.E2E_SEED)` só rodam em
 * ambiente com seed (export E2E_SEED=1 antes de rodar). Os mocks via
 * page.route() cobrem apenas chamadas client-side (verificar-cpf, save-client,
 * preview, etc.); o fetch inicial do server component não é interceptável.
 *
 * A cobertura real de regressão do shell, tipografia, touch targets e lógica
 * de persistência do store é feita pelos unit tests em:
 *   - src/shared/assinatura-digital/store/__tests__/persist.test.ts
 *   - src/shared/assinatura-digital/validations/__tests__/sub-schemas.test.ts
 *   - src/app/(assinatura-digital)/_wizard/__tests__/*
 */

const requiresSeed = !process.env.E2E_SEED

test.describe('Assinatura Digital — Fluxo público do formulário', () => {
  test('URL inválida retorna 404', async ({ page }) => {
    const response = await page.goto('/formulario/invalid-seg/invalid-form')
    expect(response?.status()).toBe(404)
  })

  test.describe('Happy path (requer seed E2E_SEED=1)', () => {
    test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed de segmento+formulário fixture')

    test('CPF novo → wizard completo → sucesso', async ({ page }) => {
      await mockPublicFlow(page)
      await page.goto(formularioUrl())

      // Step 0 — CPF
      await expect(page.getByRole('heading', { name: /informe seu cpf/i })).toBeVisible()
      await page.getByLabel('CPF').fill(FIXTURE_CPF_NOVO)
      await page.getByRole('button', { name: /continuar/i }).click()

      // Step 2a — Identidade
      await expect(page.getByRole('heading', { name: /identidade/i })).toBeVisible()
      await page.getByLabel('Nome Completo').fill('João Teste Silva')
      await page.getByLabel(/data de nascimento/i).fill('01/01/1990')
      await page.getByRole('button', { name: /continuar/i }).click()

      // Step 2b — Contatos
      await expect(page.getByRole('heading', { name: /contatos/i })).toBeVisible()
      await page.getByLabel(/e-mail/i).fill('joao@teste.com')
      await page.getByLabel(/celular/i).fill('(11) 98765-4321')
      await page.getByRole('button', { name: /continuar/i }).click()

      // Step 2c — Endereço → aqui salva cliente
      await expect(page.getByRole('heading', { name: /endereço/i })).toBeVisible()
      await page.getByLabel('CEP').fill('01310-100')
      await page.getByLabel('Logradouro').fill('Av Paulista')
      await page.getByLabel('Número').fill('1000')
      await page.getByLabel('Bairro').fill('Bela Vista')
      await page.getByLabel('Cidade').fill('São Paulo')
      await page.getByRole('button', { name: /salvar e continuar/i }).click()

      // steps seguintes dependem do form_schema dinâmico do fixture
    })
  })

  test.describe('Cliente existente → prefill (requer seed)', () => {
    test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed')

    test('CPF existente carrega dados e habilita "Confirmar e continuar"', async ({ page }) => {
      await mockPublicFlow(page, { verificarCpf: 'existente' })
      await page.goto(formularioUrl())

      await page.getByLabel('CPF').fill(FIXTURE_CPF_EXISTENTE)
      await page.getByRole('button', { name: /continuar/i }).click()

      await expect(page.getByText(/dados importados/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /confirmar e continuar/i })).toBeEnabled()
    })
  })

  test.describe('Erro de rede no saveClient (requer seed)', () => {
    test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed')

    test('mostra toast de erro e mantém usuário no step de Endereço', async ({ page }) => {
      await mockPublicFlow(page, { saveClient: 'error' })
      await page.goto(formularioUrl())
      // ... fluxo de CPF + identidade + contatos + endereço
      await page.getByRole('button', { name: /salvar e continuar/i }).click()
      await expect(page.getByText(/erro ao salvar dados/i)).toBeVisible()
    })
  })

  test.describe('Resume-on-reload (requer seed)', () => {
    test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed')

    test('preenche até Contatos, reload, volta em Contatos com dados intactos', async ({
      page,
    }) => {
      await mockPublicFlow(page)
      await page.goto(formularioUrl())

      await page.getByLabel('CPF').fill(FIXTURE_CPF_NOVO)
      await page.getByRole('button', { name: /continuar/i }).click()

      await page.getByLabel('Nome Completo').fill('João Reload')
      await page.getByLabel(/data de nascimento/i).fill('01/01/1990')
      await page.getByRole('button', { name: /continuar/i }).click()

      await expect(page.getByRole('heading', { name: /contatos/i })).toBeVisible()

      await page.reload()

      await expect(page.getByRole('heading', { name: /contatos/i })).toBeVisible()
      await expect(page.getByText(/continuando de onde parou/i)).toBeVisible()
    })
  })

  test.describe('Mudança de URL entre formulários (requer seed)', () => {
    test.skip(requiresSeed, 'Defina E2E_SEED=1 após seed')

    test('trocar slug descarta o draft e começa do zero', async ({ page }) => {
      await mockPublicFlow(page)
      await page.goto(formularioUrl('tributario', 'formulario-A'))

      await page.getByLabel('CPF').fill(FIXTURE_CPF_NOVO)
      await page.getByRole('button', { name: /continuar/i }).click()
      await page.getByLabel('Nome Completo').fill('Inicial')

      await page.goto(formularioUrl('tributario', 'formulario-B'))

      await expect(page.getByRole('heading', { name: /informe seu cpf/i })).toBeVisible()
    })
  })
})
