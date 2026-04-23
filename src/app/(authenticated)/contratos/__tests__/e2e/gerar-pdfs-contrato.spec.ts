/**
 * E2E: Gerar PDFs de Contratação (roteamento dinâmico por segmento)
 *
 * Cenários:
 * 1. Contrato com segmento + dados completos → clica no botão → ZIP é baixado
 * 2. Contrato com campos faltantes → modal aparece → preenche → ZIP é baixado
 * 3. Contrato SEM segmento definido → card não aparece (não há como resolver o formulário)
 *
 * Nota: os IDs abaixo são fallbacks; sobrescreva via variáveis de ambiente no CI.
 *   E2E_CONTRATO_TRABALHISTA_COMPLETO  — contrato com segmento configurado e todos os campos preenchidos
 *   E2E_CONTRATO_TRABALHISTA_SEM_DADOS — contrato com segmento configurado e campo(s) faltante(s)
 *   E2E_CONTRATO_SEM_SEGMENTO          — contrato sem segmento definido (segmentoId = null)
 */
import { test, expect } from '@/testing/e2e/fixtures';

const CONTRATO_TRABALHISTA_COMPLETO = Number(
  process.env.E2E_CONTRATO_TRABALHISTA_COMPLETO ?? 1,
);
const CONTRATO_TRABALHISTA_SEM_DADOS = Number(
  process.env.E2E_CONTRATO_TRABALHISTA_SEM_DADOS ?? 2,
);
const CONTRATO_SEM_SEGMENTO = Number(
  process.env.E2E_CONTRATO_SEM_SEGMENTO ?? 3,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercepta a chamada POST ao endpoint de geração de PDFs e substitui a
 * resposta por um ZIP sintético, evitando dependência de geração real de PDF.
 */
async function mockPdfsEndpoint(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  contratoId: number,
) {
  // Cria um buffer mínimo que inicia com a assinatura de ZIP (PK\x03\x04)
  const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  await page.route(
    `**/api/contratos/${contratoId}/pdfs-contratacao`,
    (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="contratacao-${contratoId}.zip"`,
        },
        body: zipMagic,
      }),
  );
}

/**
 * Intercepta a Server Action de validação e retorna "dados completos" (ok).
 */
async function mockValidacaoOk(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
) {
  await page.route('**/contratos/actions/gerar-pdfs-contrato-action*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { status: 'ok' } }),
    }),
  );
}

/**
 * Intercepta a Server Action de validação e retorna campos faltantes.
 */
async function _mockValidacaoCamposFaltantes(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  campos: Array<{ chave: string; label: string; templates: string[] }>,
) {
  await page.route('**/contratos/actions/gerar-pdfs-contrato-action*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { status: 'campos_faltantes', camposFaltantes: campos },
      }),
    }),
  );
}

/**
 * Navega para a página de detalhes de um contrato e abre a tab "Documentos".
 */
async function goToDocumentosTab(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  contratoId: number,
) {
  await page.goto(`/contratos/${contratoId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /Documentos/i }).click();
  // Aguarda o conteúdo da tab ser renderizado
  await page.waitForTimeout(400);
}

// ---------------------------------------------------------------------------
// Suite principal
// ---------------------------------------------------------------------------

test.describe('Contrato: gerar PDFs de contratação trabalhista', () => {
  // -------------------------------------------------------------------------
  // Cenário 1 — dados completos → download do ZIP
  // -------------------------------------------------------------------------
  test('baixa ZIP quando todos os dados do contrato estão completos', async ({
    authenticatedPage: page,
  }) => {
    // Arranjo: mocks de validação e endpoint de download
    await mockValidacaoOk(page);
    await mockPdfsEndpoint(page, CONTRATO_TRABALHISTA_COMPLETO);

    // A rota do contrato também precisa retornar segmentoId = 1 (trabalhista)
    // para que o <DocumentosContratacaoCard> seja renderizado.
    await page.route(
      `**/api/contratos/${CONTRATO_TRABALHISTA_COMPLETO}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CONTRATO_TRABALHISTA_COMPLETO,
              segmentoId: 1,
              statusHistorico: [],
              processos: [],
              observacoes: null,
              tipoCobranca: 'fixo',
              papelClienteNoContrato: 'reclamante',
              clienteId: 1,
            },
          }),
        }),
    );

    await goToDocumentosTab(page, CONTRATO_TRABALHISTA_COMPLETO);

    // Botão deve estar visível
    const btn = page.getByRole('button', { name: /Baixar PDFs preenchidos/i });
    await expect(btn).toBeVisible();

    // O download é acionado via fetch + <a>.click(), então capturamos via
    // evento "download" do Playwright (funciona com anchor criado dinamicamente).
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await btn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  });

  // -------------------------------------------------------------------------
  // Cenário 2 — campos faltantes → modal aparece → preenche → download
  // -------------------------------------------------------------------------
  test('abre modal de campos faltantes, preenche e baixa ZIP', async ({
    authenticatedPage: page,
  }) => {
    const campoFaltante = {
      chave: 'rg_cliente',
      label: 'RG',
      templates: ['CTPS', 'Ficha de Registro'],
    };

    // Primeira chamada retorna campos faltantes; segunda (após preencher) ok.
    let primeiraValidacao = true;
    await page.route('**/contratos/actions/gerar-pdfs-contrato-action*', (route) => {
      if (primeiraValidacao) {
        primeiraValidacao = false;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              status: 'campos_faltantes',
              camposFaltantes: [campoFaltante],
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { status: 'ok' } }),
      });
    });

    await mockPdfsEndpoint(page, CONTRATO_TRABALHISTA_SEM_DADOS);

    await page.route(
      `**/api/contratos/${CONTRATO_TRABALHISTA_SEM_DADOS}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CONTRATO_TRABALHISTA_SEM_DADOS,
              segmentoId: 1,
              statusHistorico: [],
              processos: [],
              observacoes: null,
              tipoCobranca: 'fixo',
              papelClienteNoContrato: 'reclamante',
              clienteId: 2,
            },
          }),
        }),
    );

    await goToDocumentosTab(page, CONTRATO_TRABALHISTA_SEM_DADOS);

    // Clica no botão — deve abrir o modal
    await page.getByRole('button', { name: /Baixar PDFs preenchidos/i }).click();

    // Modal deve aparecer com o título correto
    await expect(
      page.getByText(/dados do cliente estão incompletos/i),
    ).toBeVisible();

    // Preenche o campo faltante (label vem do mock: "RG")
    await page.getByLabel(/RG/i).fill('MG-12.345.678');

    // Botão de submissão do modal deve estar habilitado
    const btnGerar = page.getByRole('button', {
      name: /Gerar PDFs com esses dados/i,
    });
    await expect(btnGerar).toBeEnabled();

    // Aguarda download
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await btnGerar.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.zip$/i);

    // Modal deve ter fechado
    await expect(
      page.getByText(/dados do cliente estão incompletos/i),
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Cenário 3 — contrato sem segmento → card ausente
  // -------------------------------------------------------------------------
  test('não exibe o card quando o contrato não tem segmento definido', async ({
    authenticatedPage: page,
  }) => {
    await page.route(
      `**/api/contratos/${CONTRATO_SEM_SEGMENTO}`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: CONTRATO_SEM_SEGMENTO,
              segmentoId: null, // sem segmento → sem roteamento de formulário
              statusHistorico: [],
              processos: [],
              observacoes: null,
              tipoCobranca: 'fixo',
              papelClienteNoContrato: 'reclamante',
              clienteId: 3,
            },
          }),
        }),
    );

    await goToDocumentosTab(page, CONTRATO_SEM_SEGMENTO);

    // Sem segmento, o título do card também some — asserto por texto ancorável.
    await expect(
      page.getByRole('heading', { name: /Documentos de contratação/i }),
    ).toHaveCount(0);
  });
});
