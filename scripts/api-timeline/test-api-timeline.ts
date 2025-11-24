// Script de teste para a rota API /api/captura/trt/timeline
// Testa a captura de timeline com download de documentos

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
config();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.SERVICE_API_KEY;

// Configurações do teste
const TRT_CODIGO = 'TRT3';
const GRAU = 'primeiro_grau';
const PROCESSO_ID = '2887163';
const ADVOGADO_ID = 1;

async function testarCapturaTimeline() {
  console.log('\n🧪 Teste - API Captura Timeline\n');
  console.log(`URL: ${API_BASE_URL}/api/captura/trt/timeline`);
  console.log(`TRT: ${TRT_CODIGO}`);
  console.log(`Grau: ${GRAU}`);
  console.log(`Processo ID: ${PROCESSO_ID}\n`);

  try {
    // Preparar payload
    const payload = {
      trtCodigo: TRT_CODIGO,
      grau: GRAU,
      processoId: PROCESSO_ID,
      advogadoId: ADVOGADO_ID,
      baixarDocumentos: true, // Testar com download
      filtroDocumentos: {
        apenasAssinados: true,
        apenasNaoSigilosos: true,
        // Limitar para testar rapidamente
        // tipos: ['Certidão'],
      },
    };

    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('\n📡 Enviando requisição...\n');

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/api/captura/trt/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'x-service-api-key': API_KEY }),
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`⏱️  Tempo de resposta: ${duration}s\n`);

    // Verificar status
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      return;
    }

    // Parse da resposta
    const resultado = await response.json();

    console.log('✅ Resposta recebida:\n');
    console.log(`  Success: ${resultado.success}`);
    console.log(`  Message: ${resultado.message}\n`);

    if (resultado.data) {
      const { data } = resultado;

      console.log('📋 Estatísticas da Timeline:');
      console.log(`  Total de itens: ${data.totalItens}`);
      console.log(`  Documentos: ${data.totalDocumentos}`);
      console.log(`  Movimentos: ${data.totalMovimentos}\n`);

      console.log('📥 Documentos Baixados:');
      console.log(`  Total filtrados: ${data.documentosBaixados?.length || 0}`);
      console.log(`  Baixados com sucesso: ${data.totalBaixadosSucesso}`);
      console.log(`  Erros: ${data.totalErros}\n`);

      // Mostrar primeiros documentos
      if (data.documentosBaixados && data.documentosBaixados.length > 0) {
        console.log('📄 Primeiros documentos:\n');

        data.documentosBaixados.slice(0, 5).forEach((doc: unknown, index: number) => {
          const documento = doc as { detalhes?: { id?: number; titulo?: string; tipo?: string }; pdfTamanho?: number; erro?: string };
          console.log(`  ${index + 1}. ${documento.detalhes?.titulo || 'Sem título'}`);
          console.log(`     ID: ${documento.detalhes?.id}`);
          console.log(`     Tipo: ${documento.detalhes?.tipo}`);
          console.log(`     Tamanho PDF: ${documento.pdfTamanho ? `${(documento.pdfTamanho / 1024).toFixed(2)} KB` : 'N/A'}`);
          if (documento.erro) {
            console.log(`     ❌ Erro: ${documento.erro}`);
          }
          console.log('');
        });

        if (data.documentosBaixados.length > 5) {
          console.log(`  ... e mais ${data.documentosBaixados.length - 5} documentos\n`);
        }
      }

      // Mostrar estatísticas de movimentos
      if (data.timeline) {
        const movimentos = data.timeline.filter((item: unknown) => {
          const timelineItem = item as { documento?: boolean };
          return !timelineItem.documento;
        });
        if (movimentos.length > 0) {
          console.log('📌 Primeiros movimentos:\n');

          movimentos.slice(0, 3).forEach((mov: unknown, index: number) => {
            const movimento = mov as { titulo?: string; data?: string; codigoMovimentoCNJ?: string };
            console.log(`  ${index + 1}. ${movimento.titulo}`);
            console.log(`     Data: ${movimento.data ? new Date(movimento.data).toLocaleString('pt-BR') : 'N/A'}`);
            console.log(`     Código CNJ: ${movimento.codigoMovimentoCNJ || 'N/A'}`);
            console.log('');
          });

          if (movimentos.length > 3) {
            console.log(`  ... e mais ${movimentos.length - 3} movimentos\n`);
          }
        }
      }
    }

    console.log('='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    throw error;
  }
}

// Executar teste
testarCapturaTimeline().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
