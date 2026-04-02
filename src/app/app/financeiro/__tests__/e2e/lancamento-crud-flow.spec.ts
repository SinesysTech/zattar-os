import { test, expect } from '@/testing/e2e/fixtures';
import { waitForToast, fillLancamentoForm as _fillLancamentoForm, navigateToTab as _navigateToTab } from '@/testing/e2e/helpers';

test.describe('Financeiro - Lançamento CRUD Flow', () => {
  test('deve criar conta a receber com sucesso', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Navegar para tab "Contas a Receber"
    const contasReceberTab = page.getByRole('tab', { name: /contas a receber|receber/i });
    if (await contasReceberTab.isVisible({ timeout: 1000 })) {
      await contasReceberTab.click();
      await page.waitForTimeout(500);
    }

    // 3. Clicar em "Nova Conta a Receber"
    await page.getByRole('button', { name: /nova conta|novo lançamento|adicionar/i }).click();

    // 4. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 5. Preencher formulário
    await page.getByLabel(/descrição/i).fill('Honorários Contratuais - Cliente ABC');
    await page.getByLabel(/valor/i).fill('5000.00');
    await page.getByLabel(/data de vencimento/i).fill('31/01/2025');

    // Categoria
    await page.getByLabel(/categoria/i).click();
    await page.getByText(/honorários contratuais/i).click();

    // Forma de recebimento
    await page.getByLabel(/forma de.*pagamento|recebimento/i).click();
    await page.getByText('PIX', { exact: true }).click();

    // Cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByText('Cliente ABC Ltda').click();

    // Contrato (se existir)
    const contratoSelect = page.getByLabel(/contrato/i);
    if (await contratoSelect.isVisible({ timeout: 1000 })) {
      await contratoSelect.click();
      await page.getByText('Contrato #123').click();
    }

    // Conta Bancária
    await page.getByLabel(/conta bancária/i).click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    // Conta Contábil
    await page.getByLabel(/conta contábil|plano de contas/i).click();
    await page.getByText('1.1.01 - Receitas de Honorários').click();

    // 6. Salvar
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 7. Validar toast de sucesso
    await waitForToast(page, /conta criada com sucesso|lançamento criado/i);

    // 8. Validar que lançamento aparece na tabela
    await expect(page.getByText('Honorários Contratuais - Cliente ABC')).toBeVisible();
    await expect(page.getByText(/r\$.*5\.000,00|5000/i)).toBeVisible();
  });

  test('deve criar conta a pagar com sucesso', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Navegar para tab "Contas a Pagar"
    const contasPagarTab = page.getByRole('tab', { name: /contas a pagar|pagar/i });
    if (await contasPagarTab.isVisible({ timeout: 1000 })) {
      await contasPagarTab.click();
      await page.waitForTimeout(500);
    }

    // 3. Clicar em "Nova Conta a Pagar"
    await page.getByRole('button', { name: /nova conta|novo lançamento|adicionar/i }).click();

    // 4. Aguardar modal/dialog abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 5. Preencher formulário
    await page.getByLabel(/descrição/i).fill('Despesa de Aluguel - Janeiro 2025');
    await page.getByLabel(/valor/i).fill('2500.00');
    await page.getByLabel(/data de vencimento/i).fill('10/01/2025');

    // Categoria
    await page.getByLabel(/categoria/i).click();
    await page.getByText(/despesas operacionais|aluguel/i).click();

    // Forma de pagamento
    await page.getByLabel(/forma de.*pagamento/i).click();
    await page.getByText('Transferência', { exact: true }).click();

    // Conta Bancária
    await page.getByLabel(/conta bancária/i).click();
    await page.getByText('Banco do Brasil - CC 12345-6').click();

    // Conta Contábil
    await page.getByLabel(/conta contábil/i).click();
    await page.getByText('2.1.01 - Despesas Operacionais').click();

    // 6. Salvar
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 7. Validar sucesso
    await waitForToast(page, /conta criada com sucesso/i);

    // 8. Validar lançamento na tabela
    await expect(page.getByText('Despesa de Aluguel - Janeiro 2025')).toBeVisible();
    await expect(page.getByText(/r\$.*2\.500,00|2500/i)).toBeVisible();
  });

  test('deve editar lançamento existente', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Navegar para tab "Contas a Receber"
    const contasReceberTab = page.getByRole('tab', { name: /contas a receber/i });
    if (await contasReceberTab.isVisible({ timeout: 1000 })) {
      await contasReceberTab.click();
      await page.waitForTimeout(500);
    }

    // 3. Clicar em lançamento existente
    const lancamento = page.getByText('Honorários Contratuais - Cliente ABC').first();
    await lancamento.click();

    // 4. Aguardar detail sheet abrir
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 5. Clicar em "Editar"
    await page.getByRole('button', { name: /editar/i }).click();

    // 6. Alterar valor
    const valorInput = page.getByLabel(/valor/i);
    await valorInput.clear();
    await valorInput.fill('5500.00');

    // 7. Salvar
    await page.getByRole('button', { name: /salvar/i }).click();

    // 8. Validar sucesso
    await waitForToast(page, /atualizado com sucesso/i);

    // 9. Validar alteração
    await expect(page.getByText(/r\$.*5\.500,00|5500/i)).toBeVisible();
  });

  test('deve validar campos obrigatórios ao criar lançamento', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Clicar em "Nova Conta"
    await page.getByRole('button', { name: /nova conta|adicionar/i }).click();

    // 3. Aguardar modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // 4. Tentar salvar sem preencher campos
    await page.getByRole('button', { name: /criar|salvar/i }).click();

    // 5. Validar mensagens de erro
    await expect(page.getByText(/campo obrigatório|required/i).first()).toBeVisible();
  });

  test('deve filtrar lançamentos por período', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Usar filtro de período
    const dataInicioInput = page.getByLabel(/data início|período inicial/i);
    if (await dataInicioInput.isVisible({ timeout: 1000 })) {
      await dataInicioInput.fill('01/01/2025');

      const dataFimInput = page.getByLabel(/data fim|período final/i);
      await dataFimInput.fill('31/01/2025');

      // Aplicar filtro
      const aplicarButton = page.getByRole('button', { name: /filtrar|aplicar/i });
      if (await aplicarButton.isVisible({ timeout: 1000 })) {
        await aplicarButton.click();
      }

      await page.waitForTimeout(500);

      // Validar que lançamentos do período aparecem
      await expect(page.getByText('Honorários Contratuais')).toBeVisible();
    }
  });

  test('deve filtrar lançamentos por status', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Usar filtro de status
    const statusSelect = page.getByLabel(/status|situação/i);
    if (await statusSelect.isVisible({ timeout: 1000 })) {
      await statusSelect.click();
      await page.getByText('Pendente', { exact: true }).click();

      await page.waitForTimeout(500);

      // Validar que apenas lançamentos pendentes aparecem
      await expect(page.getByText('Pendente')).toBeVisible();
    }
  });
});

test.describe('Financeiro - Lançamento CRUD Flow (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('deve criar conta a receber em mobile', async ({ financeiroMockedPage: page }) => {
    // 1. Navegar para a página de financeiro
    await page.goto('/financeiro');
    await page.waitForLoadState('networkidle');

    // 2. Navegar para tab contas a receber (scroll horizontal se necessário)
    const contasReceberTab = page.getByRole('tab', { name: /contas a receber/i });
    if (await contasReceberTab.isVisible({ timeout: 1000 })) {
      await contasReceberTab.scrollIntoViewIfNeeded();
      await contasReceberTab.click();
      await page.waitForTimeout(500);
    }

    // 3. Scroll para botão adicionar
    const novaContaButton = page.getByRole('button', { name: /nova conta|adicionar/i });
    await novaContaButton.scrollIntoViewIfNeeded();
    await novaContaButton.click();

    // 4. Preencher formulário com scroll
    const descricaoInput = page.getByLabel(/descrição/i);
    await descricaoInput.scrollIntoViewIfNeeded();
    await descricaoInput.fill('Honorários Mobile');

    const valorInput = page.getByLabel(/valor/i);
    await valorInput.scrollIntoViewIfNeeded();
    await valorInput.fill('3000.00');

    const dataInput = page.getByLabel(/data de vencimento/i);
    await dataInput.scrollIntoViewIfNeeded();
    await dataInput.fill('31/01/2025');

    const categoriaSelect = page.getByLabel(/categoria/i);
    await categoriaSelect.scrollIntoViewIfNeeded();
    await categoriaSelect.click();
    await page.getByText(/honorários/i).click();

    const formaSelect = page.getByLabel(/forma/i);
    await formaSelect.scrollIntoViewIfNeeded();
    await formaSelect.click();
    await page.getByText('PIX').click();

    const clienteSelect = page.getByLabel(/cliente/i);
    await clienteSelect.scrollIntoViewIfNeeded();
    await clienteSelect.click();
    await page.getByText('Cliente ABC').click();

    const contaBancariaSelect = page.getByLabel(/conta bancária/i);
    await contaBancariaSelect.scrollIntoViewIfNeeded();
    await contaBancariaSelect.click();
    await page.getByText('Banco do Brasil').click();

    // 5. Scroll para salvar
    const salvarButton = page.getByRole('button', { name: /criar|salvar/i });
    await salvarButton.scrollIntoViewIfNeeded();
    await salvarButton.click();

    // 6. Validar sucesso
    await waitForToast(page, /conta criada com sucesso/i);
  });
});
