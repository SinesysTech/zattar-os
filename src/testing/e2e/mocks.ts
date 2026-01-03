import { Page, Route } from '@playwright/test';

export async function mockProcessosAPI(page: Page) {
  await page.route('**/api/processos', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              {
                id: 1,
                numero_processo: '0000000-00.2025.5.15.0001',
                trt: 'TRT15',
                grau: 'primeiro_grau',
                classe_judicial: 'Ação Trabalhista',
                nome_parte_autora: 'João da Silva',
                nome_parte_re: 'Empresa XYZ Ltda',
                orgao_julgador: '1ª Vara do Trabalho de Campinas',
                data_autuacao: '2025-01-01',
                status: 'ATIVO',
              },
            ],
            pagination: { page: 1, limit: 50, total: 1, totalPages: 1, hasMore: false },
          },
        }),
      });
    }

    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            numero_processo: '0000000-00.2025.5.15.0002',
            trt: 'TRT15',
            grau: 'primeiro_grau',
            classe_judicial: 'Ação Trabalhista',
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/processos/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.match(/\/api\/processos\/\d+$/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            numero_processo: '0000000-00.2025.5.15.0001',
            trt: 'TRT15',
            grau: 'primeiro_grau',
            classe_judicial: 'Reclamação Trabalhista',
            nome_parte_autora: 'João da Silva',
            nome_parte_re: 'Empresa XYZ Ltda',
            orgao_julgador: '1ª Vara do Trabalho de Campinas',
            data_autuacao: '2025-01-01',
            status: 'ATIVO',
          },
        }),
      });
    }

    if (method === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            classe_judicial: 'Reclamação Trabalhista',
          },
        }),
      });
    }

    if (url.includes('/partes')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nome: 'Maria Santos', tipo: 'Autor' },
              { id: 2, nome: 'Empresa ABC Ltda', tipo: 'Ré' },
            ],
          }),
        });
      }
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 3, nome: 'Maria Santos', tipo: 'Autor' },
          }),
        });
      }
    }

    if (url.includes('/documentos')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 1, nome: 'Petição Inicial', tipo: 'Petição', url: '/docs/peticao.pdf' },
            ],
          }),
        });
      }
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 2, nome: 'Petição Inicial', tipo: 'Petição' },
          }),
        });
      }
    }

    if (url.includes('/timeline')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                descricao: 'Processo Iniciado',
                data: '2025-01-01',
                tipo: 'sistema'
              },
              {
                id: 2,
                descricao: 'Audiência realizada',
                data: '2025-01-15',
                tipo: 'manual'
              },
            ],
          }),
        });
      }
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 3,
              descricao: 'Audiência realizada',
              data: '2025-01-15'
            },
          }),
        });
      }
    }

    return route.continue();
  });
}

export async function mockAudienciasAPI(page: Page) {
  await page.route('**/api/audiencias', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              processo_id: 1,
              numero_processo: '0000000-00.2025.5.15.0001',
              tipo: 'Audiência Inicial',
              modalidade: 'virtual',
              url_virtual: 'https://zoom.us/j/123456789',
              data_inicio: '2025-01-20T14:00:00',
              data_fim: '2025-01-20T15:00:00',
              responsavel: 'Dr. João Silva',
              status: 'Agendada',
            },
          ],
        }),
      });
    }

    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            tipo: 'Audiência Inicial',
            status: 'Agendada',
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/audiencias/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.match(/\/api\/audiencias\/\d+$/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            tipo: 'Audiência Inicial',
            modalidade: 'virtual',
            data_inicio: '2025-01-25T10:00:00',
            data_fim: '2025-01-25T11:00:00',
            status: 'Agendada',
          },
        }),
      });
    }

    if (method === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            data_inicio: '2025-01-25T10:00:00',
            data_fim: '2025-01-25T11:00:00',
          },
        }),
      });
    }

    if (method === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Audiência cancelada',
        }),
      });
    }

    if (url.includes('/participantes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nome: 'João da Silva', tipo: 'Cliente' },
            { id: 2, nome: 'Dr. João Silva', tipo: 'Advogado' },
            { id: 3, nome: 'Juiz Dr. Carlos', tipo: 'Juiz' },
          ],
        }),
      });
    }

    if (url.includes('/notificar')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Notificações enviadas com sucesso',
          data: {
            notificados: 3,
            status: 'Notificada',
          },
        }),
      });
    }

    if (url.includes('/ata')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              resumo: 'Audiência de conciliação realizada. Partes não chegaram a acordo.',
              resultado: 'Sem Acordo',
              observacoes: 'Próxima audiência de instrução agendada para 15/02/2025',
              arquivo_url: '/docs/ata.pdf',
            },
          }),
        });
      }
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 1,
              resultado: 'Sem Acordo',
            },
          }),
        });
      }
    }

    return route.continue();
  });

  await page.route('**/api/audiencias/tipos', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { value: 'inicial_virtual', label: 'Audiência Inicial (Virtual)' },
          { value: 'instrucao_presencial', label: 'Audiência de Instrução (Presencial)' },
          { value: 'conciliacao', label: 'Audiência de Conciliação' },
        ],
      }),
    });
  });

  await page.route('**/api/audiencias/salas', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, nome: 'Sala 3 - 1ª Vara' },
          { id: 2, nome: 'Sala 5 - 2ª Vara' },
        ],
      }),
    });
  });
}

export async function mockFinanceiroAPI(page: Page) {
  await page.route('**/api/financeiro/contas-bancarias', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, nome: 'Banco do Brasil - CC 12345-6' },
          { id: 2, nome: 'Caixa Econômica - CC 98765-4' },
        ],
      }),
    });
  });

  await page.route('**/api/financeiro/plano-contas', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, codigo: '1.1.01', nome: 'Receitas de Honorários' },
          { id: 2, codigo: '2.1.01', nome: 'Despesas Operacionais' },
        ],
      }),
    });
  });

  await page.route('**/api/financeiro/lancamentos', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              descricao: 'Honorários Contratuais - Cliente ABC',
              valor: 5000.00,
              data_vencimento: '2025-01-31',
              categoria: 'honorarios_contratuais',
              forma_pagamento: 'pix',
              status: 'Pendente',
            },
          ],
        }),
      });
    }

    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            descricao: 'Honorários Contratuais - Cliente ABC',
            valor: 5000.00,
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/financeiro/extratos', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 1,
            data: '2025-01-15',
            descricao: 'PIX Recebido',
            valor: 5000.00,
            tipo: 'credito',
          },
        ],
      }),
    });
  });

  await page.route('**/api/financeiro/conciliacao/**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: route.request().url().includes('automatica')
          ? '5 lançamentos conciliados automaticamente'
          : 'Lançamento conciliado com sucesso',
        data: {
          status: 'Conciliado',
          conciliados: 5,
        },
      }),
    });
  });

  await page.route('**/api/financeiro/relatorios/**', async (route: Route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            tipo: 'Fluxo de Caixa',
            periodo: '01/01/2025 - 31/01/2025',
            receitas_total: 50000.00,
            despesas_total: 20000.00,
            saldo: 30000.00,
            categorias: [
              { nome: 'Honorários', valor: 40000.00 },
              { nome: 'Êxitos', valor: 10000.00 },
            ],
          },
        }),
      });
    }

    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tipo: 'Fluxo de Caixa',
            receitas_total: 50000.00,
            despesas_total: 20000.00,
            saldo: 30000.00,
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/financeiro/export', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Exportação iniciada',
        data: {
          url: '/downloads/contas-receber-2025-01.xlsx',
        },
      }),
    });
  });
}

export async function mockObrigacoesAPI(page: Page) {
  await page.route('**/api/obrigacoes/acordos', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              processo_id: 1,
              numero_processo: '0000000-00.2025.5.15.0001',
              tipo: 'Acordo',
              direcao: 'Recebimento',
              valor_total: 100000.00,
              numero_parcelas: 10,
              percentual_escritorio: 30,
              status: 'Ativo',
            },
          ],
        }),
      });
    }

    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Acordo criado com sucesso',
          data: {
            id: 2,
            valor_total: 100000.00,
            numero_parcelas: 10,
            parcelas_geradas: 10,
            valor_parcela: 10000.00,
            repasse_escritorio: 3000.00,
            repasse_cliente: 7000.00,
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/obrigacoes/acordos/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.match(/\/api\/obrigacoes\/acordos\/\d+$/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            tipo: 'Acordo',
            valor_total: 100000.00,
            numero_parcelas: 10,
            percentual_escritorio: 30,
          },
        }),
      });
    }

    if (url.includes('/parcelas')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 10 }, (_, i) => ({
              id: i + 1,
              numero: i + 1,
              valor: 10000.00,
              data_vencimento: `2025-0${Math.min(i + 1, 9)}-${31 - i}`,
              status: i === 0 ? 'Pago' : 'Pendente',
              repasse_escritorio: 3000.00,
              repasse_cliente: 7000.00,
            })),
          }),
        });
      }
    }

    if (url.includes('/repasses')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              tipo: 'Cliente',
              valor_bruto: 10000.00,
              honorarios_sucumbenciais: 500.00,
              percentual_escritorio: 30,
              valor_liquido: 6500.00,
              status: 'Pendente',
            },
            {
              id: 2,
              tipo: 'Escritório',
              valor_bruto: 10000.00,
              valor_liquido: 3000.00,
              status: 'Pendente',
            },
          ],
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/obrigacoes/parcelas/**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.match(/\/api\/obrigacoes\/parcelas\/\d+$/)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 1,
            numero: 1,
            valor: 12000.00,
            data_vencimento: '2025-02-15',
            status: 'Pendente',
          },
        }),
      });
    }

    if (method === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Parcela atualizada com sucesso',
          data: {
            id: 1,
            valor: 12000.00,
            data_vencimento: '2025-02-15',
          },
        }),
      });
    }

    if (url.includes('/pagamento')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Pagamento registrado com sucesso',
          data: {
            id: 1,
            status: 'Pago',
            data_pagamento: '2025-01-31',
            valor_pago: 10000.00,
          },
        }),
      });
    }

    if (url.includes('/comprovante')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Comprovante anexado',
          data: {
            comprovante_url: '/docs/comprovante.pdf',
          },
        }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/obrigacoes/repasses/**', async (route: Route) => {
    const url = route.request().url();

    if (url.includes('/processar')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Repasse processado com sucesso',
          data: {
            id: 1,
            valor_liquido: 6500.00,
            status: 'Processado',
            lancamento_id: 123,
          },
        }),
      });
    }

    if (url.includes('/comprovante')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Comprovante anexado',
        }),
      });
    }

    return route.continue();
  });
}

export async function mockCommonAPIs(page: Page) {
  await page.route('**/api/clientes/**', async (route: Route) => {
    if (route.request().url().includes('sugestoes')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, nome: 'Maria Santos', email: 'maria@example.com' },
            { id: 2, nome: 'João Silva', email: 'joao@example.com' },
          ],
        }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, nome: 'Cliente ABC Ltda' },
          { id: 2, nome: 'Cliente XYZ SA' },
        ],
      }),
    });
  });

  await page.route('**/api/contratos', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, numero: 'Contrato #123', cliente_nome: 'Cliente ABC Ltda' },
          { id: 2, numero: 'Contrato #456', cliente_nome: 'Cliente XYZ SA' },
        ],
      }),
    });
  });

  await page.route('**/api/usuarios', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, nome: 'Dr. João Silva', cargo: 'Advogado' },
          { id: 2, nome: 'Dra. Maria Santos', cargo: 'Advogada' },
        ],
      }),
    });
  });

  await page.route('**/api/acervo', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 1,
            numero_processo: '0000000-00.2025.5.15.0001',
            trt: 'TRT15',
          },
        ],
      }),
    });
  });

  await page.route('**/api/documentos/upload', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 1,
          url: '/uploads/documento.pdf',
          nome: 'documento.pdf',
        },
      }),
    });
  });
}
