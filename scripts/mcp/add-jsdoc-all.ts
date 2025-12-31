#!/usr/bin/env tsx

/**
 * Script para adicionar comentários JSDoc para TODAS as tools do registry.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Mapeamento de exemplos (expandido)
const toolExamples: Record<string, string[]> = {
  // PROCESSOS
  listar_processos: [`await executeMcpTool('listar_processos', { limite: 10, trt: 'TRT15', status: 'ativo' });`],
  buscar_processos_por_cpf: [`await executeMcpTool('buscar_processos_por_cpf', { cpf: '12345678901', limite: 50 });`],
  buscar_processos_por_cnpj: [`await executeMcpTool('buscar_processos_por_cnpj', { cnpj: '12345678000190' });`],
  buscar_processo_por_numero: [`await executeMcpTool('buscar_processo_por_numero', { numero_processo: '0001234-56.2023.5.15.0001' });`],

  // PARTES
  listar_clientes: [`await executeMcpTool('listar_clientes', { limite: 20 });`],
  buscar_cliente_por_cpf: [`await executeMcpTool('buscar_cliente_por_cpf', { cpf: '12345678901' });`],
  buscar_cliente_por_cnpj: [`await executeMcpTool('buscar_cliente_por_cnpj', { cnpj: '12345678000190' });`],
  listar_partes_contrarias: [`await executeMcpTool('listar_partes_contrarias', { limite: 10 });`],
  listar_terceiros: [`await executeMcpTool('listar_terceiros', { limite: 10 });`],
  listar_representantes: [`await executeMcpTool('listar_representantes', { limite: 10 });`],

  // CONTRATOS
  listar_contratos: [`await executeMcpTool('listar_contratos', { limite: 10, status: 'ativo' });`],
  criar_contrato: [`await executeMcpTool('criar_contrato', { cliente_id: 1, tipo: 'honorarios', valor: 5000 });`],
  atualizar_contrato: [`await executeMcpTool('atualizar_contrato', { contrato_id: 1, status: 'ativo' });`],
  buscar_contrato_por_cliente: [`await executeMcpTool('buscar_contrato_por_cliente', { cliente_id: 1 });`],

  // FINANCEIRO - Plano de Contas
  listar_plano_contas: [`await executeMcpTool('listar_plano_contas', {});`],
  criar_conta: [`await executeMcpTool('criar_conta', { codigo: '1.1.01', nome: 'Conta Exemplo' });`],
  atualizar_conta: [`await executeMcpTool('atualizar_conta', { conta_id: 1, nome: 'Nome Atualizado' });`],
  excluir_conta: [`await executeMcpTool('excluir_conta', { conta_id: 1 });`],
  buscar_conta_por_codigo: [`await executeMcpTool('buscar_conta_por_codigo', { codigo: '1.1.01' });`],

  // FINANCEIRO - Lançamentos
  listar_lancamentos: [`await executeMcpTool('listar_lancamentos', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });`],
  criar_lancamento: [`await executeMcpTool('criar_lancamento', { tipo: 'receita', valor: 1500, conta_id: 10 });`],
  atualizar_lancamento: [`await executeMcpTool('atualizar_lancamento', { lancamento_id: 1, valor: 2000 });`],
  excluir_lancamento: [`await executeMcpTool('excluir_lancamento', { lancamento_id: 1 });`],
  confirmar_lancamento: [`await executeMcpTool('confirmar_lancamento', { lancamento_id: 1 });`],
  cancelar_lancamento: [`await executeMcpTool('cancelar_lancamento', { lancamento_id: 1 });`],
  estornar_lancamento: [`await executeMcpTool('estornar_lancamento', { lancamento_id: 1 });`],
  buscar_lancamento_por_id: [`await executeMcpTool('buscar_lancamento_por_id', { lancamento_id: 1 });`],
  listar_lancamentos_pendentes: [`await executeMcpTool('listar_lancamentos_pendentes', { limite: 20 });`],

  // FINANCEIRO - DRE
  gerar_dre: [`await executeMcpTool('gerar_dre', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });`],
  comparar_dre: [`await executeMcpTool('comparar_dre', { periodo1_inicio: '2024-01-01', periodo1_fim: '2024-01-31', periodo2_inicio: '2025-01-01', periodo2_fim: '2025-01-31' });`],
  exportar_dre: [`await executeMcpTool('exportar_dre', { data_inicio: '2025-01-01', data_fim: '2025-01-31', formato: 'pdf' });`],

  // FINANCEIRO - Fluxo de Caixa
  listar_fluxo_caixa: [`await executeMcpTool('listar_fluxo_caixa', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });`],
  projecao_fluxo_caixa: [`await executeMcpTool('projecao_fluxo_caixa', { dias: 30 });`],
  saldo_atual: [`await executeMcpTool('saldo_atual', {});`],
  movimentacoes_periodo: [`await executeMcpTool('movimentacoes_periodo', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });`],

  // FINANCEIRO - Conciliação
  listar_conciliacoes: [`await executeMcpTool('listar_conciliacoes', { limite: 10 });`],
  criar_conciliacao: [`await executeMcpTool('criar_conciliacao', { conta_id: 1, data_referencia: '2025-01-31' });`],
  atualizar_conciliacao: [`await executeMcpTool('atualizar_conciliacao', { conciliacao_id: 1, status: 'conciliado' });`],

  // FINANCEIRO - Outros
  listar_centros_custo: [`await executeMcpTool('listar_centros_custo', {});`],
  listar_formas_pagamento: [`await executeMcpTool('listar_formas_pagamento', {});`],
  resumo_financeiro: [`await executeMcpTool('resumo_financeiro', { data_inicio: '2025-01-01', data_fim: '2025-01-31' });`],
  criar_centro_custo: [`await executeMcpTool('criar_centro_custo', { codigo: 'CC01', nome: 'Centro de Custo' });`],
  criar_forma_pagamento: [`await executeMcpTool('criar_forma_pagamento', { nome: 'PIX', tipo: 'transferencia' });`],
  relatorio_inadimplencia: [`await executeMcpTool('relatorio_inadimplencia', { data_corte: '2025-01-31' });`],

  // CHAT
  listar_salas: [`await executeMcpTool('listar_salas', { limite: 10 });`],
  listar_mensagens: [`await executeMcpTool('listar_mensagens', { sala_id: 1, limite: 50 });`],
  buscar_historico: [`await executeMcpTool('buscar_historico', { termo: 'importante', limite: 20 });`],
  enviar_mensagem: [`await executeMcpTool('enviar_mensagem', { sala_id: 1, conteudo: 'Mensagem de teste' });`],
  criar_sala: [`await executeMcpTool('criar_sala', { nome: 'Nova Sala', participantes: [1, 2, 3] });`],
  listar_participantes: [`await executeMcpTool('listar_participantes', { sala_id: 1 });`],

  // DOCUMENTOS
  listar_documentos: [`await executeMcpTool('listar_documentos', { limite: 20 });`],
  buscar_documentos_por_tags: [`await executeMcpTool('buscar_documentos_por_tags', { tags: ['importante'], limite: 10 });`],
  listar_templates: [`await executeMcpTool('listar_templates', { limite: 20 });`],
  criar_documento: [`await executeMcpTool('criar_documento', { titulo: 'Novo Documento', tipo: 'contrato' });`],
  atualizar_documento: [`await executeMcpTool('atualizar_documento', { documento_id: 1, titulo: 'Título Atualizado' });`],
  buscar_documento_por_id: [`await executeMcpTool('buscar_documento_por_id', { documento_id: 1 });`],

  // EXPEDIENTES
  listar_expedientes: [`await executeMcpTool('listar_expedientes', { limite: 20, status: 'aberto' });`],
  buscar_expediente_por_processo: [`await executeMcpTool('buscar_expediente_por_processo', { processo_id: 1 });`],
  criar_expediente: [`await executeMcpTool('criar_expediente', { processo_id: 1, tipo: 'oficio' });`],
  atualizar_expediente: [`await executeMcpTool('atualizar_expediente', { expediente_id: 1, status: 'processando' });`],
  fechar_expediente: [`await executeMcpTool('fechar_expediente', { expediente_id: 1 });`],
  reabrir_expediente: [`await executeMcpTool('reabrir_expediente', { expediente_id: 1 });`],
  transferir_expediente: [`await executeMcpTool('transferir_expediente', { expediente_id: 1, destinatario_id: 2 });`],

  // AUDIÊNCIAS
  listar_audiencias: [`await executeMcpTool('listar_audiencias', { limite: 10 });`],
  buscar_audiencia_por_processo: [`await executeMcpTool('buscar_audiencia_por_processo', { processo_numero: '0001234-56.2023.5.15.0001' });`],
  buscar_audiencias_por_cpf: [`await executeMcpTool('buscar_audiencias_por_cpf', { cpf: '12345678901' });`],
  buscar_audiencias_por_cnpj: [`await executeMcpTool('buscar_audiencias_por_cnpj', { cnpj: '12345678000190' });`],
  atualizar_status_audiencia: [`await executeMcpTool('atualizar_status_audiencia', { audiencia_id: 1, status: 'realizada' });`],
  registrar_resultado_audiencia: [`await executeMcpTool('registrar_resultado_audiencia', { audiencia_id: 1, resultado: 'acordo' });`],

  // OBRIGAÇÕES
  listar_acordos: [`await executeMcpTool('listar_acordos', { limite: 10 });`],
  listar_repasses: [`await executeMcpTool('listar_repasses', { limite: 10 });`],
  criar_acordo: [`await executeMcpTool('criar_acordo', { processo_id: 1, valor: 50000 });`],
  atualizar_acordo: [`await executeMcpTool('atualizar_acordo', { acordo_id: 1, status: 'ativo' });`],
  criar_repasse: [`await executeMcpTool('criar_repasse', { acordo_id: 1, valor: 5000 });`],

  // RH
  listar_salarios: [`await executeMcpTool('listar_salarios', { limite: 10 });`],
  listar_folhas_pagamento: [`await executeMcpTool('listar_folhas_pagamento', { limite: 10 });`],

  // DASHBOARD
  obter_metricas: [`await executeMcpTool('obter_metricas', {});`],
  obter_dashboard: [`await executeMcpTool('obter_dashboard', { periodo: 'mes' });`],

  // BUSCA SEMÂNTICA
  buscar_semantica: [`await executeMcpTool('buscar_semantica', { consulta: 'processos trabalhistas', limite: 10 });`],

  // CAPTURA
  listar_capturas_cnj: [`await executeMcpTool('listar_capturas_cnj', { limite: 10 });`],
  listar_timelines: [`await executeMcpTool('listar_timelines', { processo_id: 1, limite: 50 });`],

  // USUÁRIOS
  listar_usuarios: [`await executeMcpTool('listar_usuarios', { limite: 20 });`],
  buscar_usuario_por_email: [`await executeMcpTool('buscar_usuario_por_email', { email: 'usuario@exemplo.com' });`],
  buscar_usuario_por_cpf: [`await executeMcpTool('buscar_usuario_por_cpf', { cpf: '12345678901' });`],
  listar_permissoes_usuario: [`await executeMcpTool('listar_permissoes_usuario', { usuario_id: 1 });`],

  // OUTROS
  listar_acervo: [`await executeMcpTool('listar_acervo', { limite: 10 });`],
  listar_assistentes: [`await executeMcpTool('listar_assistentes', { limite: 10 });`],
  listar_cargos: [`await executeMcpTool('listar_cargos', {});`],
  listar_templates_assinatura: [`await executeMcpTool('listar_templates_assinatura', { limite: 10 });`],
};

function generateJSDoc(toolName: string, description: string): string {
  const examples = toolExamples[toolName] || [
    `await executeMcpTool('${toolName}', { /* parâmetros */ });`
  ];

  let jsdoc = '  /**\n';
  jsdoc += `   * ${description}\n`;
  jsdoc += '   *\n';

  for (const example of examples) {
    jsdoc += '   * @example\n';
    jsdoc += `   * ${example}\n`;
  }

  jsdoc += '   *\n';
  jsdoc += `   * @returns Promise com resultado da operação\n`;
  jsdoc += '   */\n';
  return jsdoc;
}

function processRegistry(): void {
  console.log('📝 Adicionando JSDoc para TODAS as tools...\n');

  const registryPath = path.join(process.cwd(), 'src', 'lib', 'mcp', 'registry.ts');
  let content = fs.readFileSync(registryPath, 'utf-8');

  // Regex para encontrar registerMcpTool calls que NÃO têm JSDoc
  const lines = content.split('\n');
  const newLines: string[] = [];
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Se encontrar registerMcpTool E a linha anterior NÃO for */
    if (line.trim().startsWith('registerMcpTool({')) {
      const prevLine = i > 0 ? lines[i - 1] : '';

      // Se já tem JSDoc, pular
      if (prevLine.trim() === '*/') {
        newLines.push(line);
        continue;
      }

      // Extrair nome e descrição
      const nextLines = lines.slice(i, i + 5).join('\n');
      const nameMatch = nextLines.match(/name: '([^']+)'/);
      const descMatch = nextLines.match(/description: '([^']+)'/);

      if (nameMatch && descMatch) {
        const toolName = nameMatch[1];
        const description = descMatch[1];
        const jsdoc = generateJSDoc(toolName, description);

        // Inserir JSDoc
        newLines.push(...jsdoc.split('\n'));
        newLines.push(line);
        count++;
        console.log(`   ✅ ${toolName}`);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  const newContent = newLines.join('\n');
  fs.writeFileSync(registryPath, newContent, 'utf-8');

  console.log(`\n✅ JSDoc adicionado para ${count} tools!`);
  console.log(`📄 Arquivo: ${registryPath}\n`);
}

processRegistry();
