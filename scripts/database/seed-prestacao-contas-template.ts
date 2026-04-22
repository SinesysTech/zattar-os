/**
 * Seed idempotente do template padrão "Declaração de Prestação de Contas".
 *
 * Rodar com: `npm run seed:prestacao-contas`
 *
 * O que faz:
 * 1. Gera um PDF a partir do Markdown canônico (mantém placeholders visíveis).
 * 2. Faz upload para Backblaze B2 em assinatura-digital/prestacao-contas/templates/.
 * 3. UPSERT no registro com slug = 'declaracao-prestacao-contas-default',
 *    com flag sistema=true (protegido contra exclusão).
 *
 * Idempotente: pode ser rodado múltiplas vezes sem duplicação.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { gerarPdfPrestacaoContas } from '../../src/shared/prestacao-contas/services/pdf-generator';
import { storePrestacaoContasPdf } from '../../src/shared/assinatura-digital/services/storage.service';

const SLUG = 'declaracao-prestacao-contas-default';

const MARKDOWN_CANONICO = `# Declaração de Prestação de Contas

Eu, **{{cliente.nome}}**, inscrito(a) no CPF **{{cliente.cpf}}**, DECLARO, para os devidos fins, que recebi do escritório **{{escritorio.razao_social}}** (OAB {{escritorio.oab}}) a quantia de **{{parcela.valor_repasse_liquido_formatado}}** ({{parcela.valor_repasse_liquido_extenso}}), referente à {{acordo.tipo_label}} nº {{parcela.numero}}/{{acordo.numero_parcelas}} do processo **{{processo.numero}}**, em trâmite perante {{processo.orgao_julgador}}.

## Detalhamento do valor

| Rubrica | Valor |
|---|---|
| Valor bruto da parcela | {{parcela.valor_bruto_formatado}} |
| Honorários contratuais ({{acordo.percentual_escritorio}}%) | {{parcela.honorarios_contratuais_formatado}} |
| Honorários sucumbenciais | {{parcela.honorarios_sucumbenciais_formatado}} |
| **Valor líquido recebido pelo cliente** | **{{parcela.valor_repasse_liquido_formatado}}** |

## Dados bancários informados para recebimento

- **Banco:** {{banco.nome}} ({{banco.codigo}})
- **Agência:** {{banco.agencia_completa}}
- **Conta:** {{banco.conta_completa}} ({{banco.tipo_conta_label}})
- **Titular:** {{banco.titular_nome}} — CPF {{banco.titular_cpf}}
{{#banco.chave_pix}}- **Chave PIX:** {{banco.chave_pix}} ({{banco.tipo_chave_pix_label}})
{{/banco.chave_pix}}

Declaro que os dados bancários acima são verdadeiros e de minha titularidade, e autorizo o escritório a efetuar o depósito do valor líquido informado nessa conta.

{{cidade}}, {{data_assinatura_extenso}}.
`;

// PNG transparente 1×1 — placeholder de assinatura para o PDF seed
const ASSINATURA_TRANSPARENTE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Faltando NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('→ Gerando PDF seed com placeholders visíveis...');
  const { buffer } = await gerarPdfPrestacaoContas({
    markdownResolvido: MARKDOWN_CANONICO,
    assinaturaPngBase64: ASSINATURA_TRANSPARENTE_BASE64,
    metadados: {
      protocolo: 'SEED',
      dataAssinatura: '(exemplo)',
      clienteNome: '{{cliente.nome}}',
      clienteCpf: '{{cliente.cpf}}',
      hashOriginal: 'seed',
      termosAceiteVersao: 'v1.0-MP2200-2',
    },
  });

  console.log(`  PDF gerado: ${buffer.length} bytes`);

  console.log('→ Upload para Backblaze B2...');
  const stored = await storePrestacaoContasPdf(buffer, 0, 'template-default');
  console.log(`  URL: ${stored.url}`);

  console.log('→ Upsert do template no banco...');
  const { error } = await supabase
    .from('assinatura_digital_templates')
    .upsert(
      {
        slug: SLUG,
        nome: 'Declaração de Prestação de Contas',
        descricao:
          'Template padrão usado quando o operador gera link público de prestação de contas a partir de uma parcela recebida. Variáveis disponíveis: {{cliente.*}}, {{parcela.*}}, {{acordo.*}}, {{processo.*}}, {{banco.*}}, {{escritorio.*}}, {{data_assinatura_extenso}}, {{cidade}}. Suporta bloco condicional {{#banco.chave_pix}}...{{/banco.chave_pix}}.',
        sistema: true,
        ativo: true,
        status: 'ativo',
        versao: 1,
        tipo_template: 'prestacao_contas',
        conteudo_markdown: MARKDOWN_CANONICO,
        arquivo_original: stored.url,
        pdf_url: stored.url,
        arquivo_nome: 'declaracao-prestacao-contas-default.pdf',
        arquivo_tamanho: buffer.length,
      },
      { onConflict: 'slug' },
    );

  if (error) {
    console.error('✗ Erro no upsert:', error);
    process.exit(1);
  }

  console.log(`✓ Template de prestação de contas seedado (slug=${SLUG}).`);
  console.log(`  Editável via UI em /assinatura-digital/templates`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
