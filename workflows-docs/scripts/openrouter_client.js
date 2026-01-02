import dotenv from "dotenv";

// Carregar variáveis de ambiente (prioriza .env.local como no Next.js)
dotenv.config({ path: ".env.local" });
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-3-flash-preview";

function parseJsonFromModelContent(rawContent) {
  let content = String(rawContent ?? "").trim();

  if (content.startsWith("```json")) content = content.slice(7);
  if (content.startsWith("```")) content = content.slice(3);
  if (content.endsWith("```")) content = content.slice(0, -3);
  content = content.trim();

  try {
    return JSON.parse(content);
  } catch {
    const first = content.indexOf("{");
    const last = content.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const slice = content.slice(first, last + 1);
      return JSON.parse(slice);
    }
    throw new Error(
      "Não foi possível extrair JSON válido da resposta do modelo"
    );
  }
}

export class OpenRouterClient {
  constructor() {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY não encontrada no arquivo .env");
    }

    this.apiKey = OPENROUTER_API_KEY;
    this.model = MODEL;
  }

  async extractContractData(pdfText) {
    const textLimit = 15000;
    let text = pdfText ?? "";

    if (text.length > textLimit) {
      const inicio = text.slice(0, 8000);
      const fim = text.slice(-4000);
      text = `${inicio}\n\n[... texto intermediário omitido ...]\n\n${fim}`;
    }

    const prompt = `Analise o documento abaixo e extraia os dados solicitados em formato JSON.

CLASSIFICAÇÃO DO DOCUMENTO:
Identifique se o documento é:
- "CONTRATO" (Contratos de prestação de serviços, termos de adesão, etc.)
- "PROCURACAO" (Instrumento de procuração / mandato)
- "DECLARACAO" (Declarações de residência, hipossuficiência, etc.)
- "OUTROS" (Qualquer outro tipo)

EXTRAIR DADOS:

1. **QUALIFICAÇÃO (Para todos os tipos):**
   - Busque identificar a pessoa principal do documento (Contratante, Outorgante ou Declarante).
   - nome_completo: Nome completo
   - cpf: CPF formatado (XXX.XXX.XXX-XX)
   - rg: RG
   - endereco: Endereço completo
   - telefone: Telefone
   - email: Email
   - profissao: Profissão
   - estado_civil: Estado civil
   - nacionalidade: Nacionalidade

2. **OBJETO (Apenas para CONTRATO):**
   - nome: Nome da empresa/entidade contratada (ex: "UBER", "IFOOD", "99", etc.)

3. **DATA (Para todos os tipos):**
   - data_assinatura: A data final de assinatura ou emissão no formato DD/MM/AAAA.

IMPORTANTE:
- Retorne APENAS JSON válido.
- Use null para campos não encontrados.

Texto do documento:
${text}

JSON esperado:
{
  "tipo_documento": "CONTRATO" | "PROCURACAO" | "DECLARACAO" | "OUTROS",
  "qualificacao_contratante": {
    "nome_completo": "...",
    "cpf": "...",
    "rg": "...",
    "endereco": "...",
    "telefone": "...",
    "email": "...",
    "profissao": "...",
    "estado_civil": "...",
    "nacionalidade": "..."
  },
  "objeto_contrato": {
    "nome": "..."
  },
  "data_assinatura": "..."
}`;

    try {
      const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/sinesys/workflow-docs",
          "X-Title": "Doc Processor",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente especializado em análise e extração de dados de documentos jurídicos. Responda estritamente com JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter HTTP ${res.status}: ${body.slice(0, 500)}`);
      }

      const result = await res.json();
      const content = result?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`OpenRouter: resposta sem conteúdo.`);
      }

      return parseJsonFromModelContent(content);
    } catch (e) {
      console.error(`[OpenRouterClient] Falha: ${e?.message ?? e}`);
      return this._getEmptyStructure();
    }
  }

  _getEmptyStructure() {
    return {
      tipo_documento: "OUTROS",
      qualificacao_contratante: {
        nome_completo: null,
        cpf: null,
        rg: null,
        endereco: null,
        telefone: null,
        email: null,
        profissao: null,
        estado_civil: null,
        nacionalidade: null,
      },
      objeto_contrato: {
        nome: null,
      },
      data_assinatura: null,
    };
  }
}
