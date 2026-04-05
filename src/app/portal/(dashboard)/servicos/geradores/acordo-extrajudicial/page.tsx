"use client";

import { useState, useCallback, useMemo } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  CalculatorShell,
  SelectOption,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
  CurrencyInput,
} from "@/app/portal/feature/servicos";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Verba {
  id: string;
  descricao: string;
  valor: number;
  valorRaw: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatDataBR(isoDate: string): string {
  if (!isoDate) return "___/___/______";
  return new Date(isoDate + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDataExtenso(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Placeholder / Bold ───────────────────────────────────────────────────────

function Placeholder({ text }: { text: string }) {
  return <span className="text-muted-foreground/30 italic">[{text}]</span>;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-foreground">{children}</span>;
}

// ─── Input style ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";

const labelCls =
  "block text-xs font-bold text-muted-foreground uppercase tracking-wider";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AcordoExtrajudicialPage() {
  // Empregado
  const [nomeEmpregado, setNomeEmpregado] = useState("");
  const [cpfEmpregado, setCpfEmpregado] = useState("");
  const [profissao, setProfissao] = useState("");
  const [ctps, setCtps] = useState("");
  const [serie, setSerie] = useState("");
  const [enderecoEmpregado, setEnderecoEmpregado] = useState("");
  const [advEmpregado, setAdvEmpregado] = useState("");
  const [oabEmpregado, setOabEmpregado] = useState("");

  // Empregador
  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [enderecoEmpregador, setEnderecoEmpregador] = useState("");
  const [advEmpregador, setAdvEmpregador] = useState("");
  const [oabEmpregador, setOabEmpregador] = useState("");

  // Contrato
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [dataDemissao, setDataDemissao] = useState("");

  // Quitacao e pagamento
  const [tipoQuitacao, setTipoQuitacao] = useState("geral");
  const [formaPagamento, setFormaPagamento] = useState("avista");
  const [numeroParcelas, setNumeroParcelas] = useState(2);

  // Multa
  const [percentualMulta, setPercentualMulta] = useState(50);

  // Verbas
  const [verbas, setVerbas] = useState<Verba[]>([
    { id: generateId(), descricao: "", valor: 0, valorRaw: "" },
  ]);

  // Cidade
  const [cidade, setCidade] = useState("");

  const dataAtual = useMemo(() => new Date(), []);

  // ─── Verbas helpers ───────────────────────────────────────────────────────

  const addVerba = useCallback(() => {
    setVerbas((prev) => [
      ...prev,
      { id: generateId(), descricao: "", valor: 0, valorRaw: "" },
    ]);
  }, []);

  const removeVerba = useCallback((id: string) => {
    setVerbas((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const updateVerbaDescricao = useCallback((id: string, descricao: string) => {
    setVerbas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, descricao } : v))
    );
  }, []);

  const updateVerbaValor = useCallback(
    (id: string, valor: number, valorRaw: string) => {
      setVerbas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, valor, valorRaw } : v))
      );
    },
    []
  );

  const totalVerbas = useMemo(
    () => verbas.reduce((sum, v) => sum + v.valor, 0),
    [verbas]
  );

  const valorParcela = useMemo(
    () => (numeroParcelas > 0 ? totalVerbas / numeroParcelas : 0),
    [totalVerbas, numeroParcelas]
  );

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const buildDocumentLines = useCallback((): string[] => {
    const lines: string[] = [];
    const cidadeStr = cidade || "___________";
    const dataStr = formatDataExtenso(dataAtual);

    lines.push("PETICAO DE HOMOLOGACAO DE ACORDO EXTRAJUDICIAL");
    lines.push("(Art. 855-B da CLT)");
    lines.push("");
    lines.push(
      `REQUERENTE (EMPREGADO): ${nomeEmpregado || "_______________"}, ${profissao || "_______________"}, CPF ${cpfEmpregado || "___.___.___-__"},`
    );
    lines.push(
      `CTPS ${ctps || "___________"} Serie ${serie || "___"}, residente em ${enderecoEmpregado || "_______________"}.`
    );
    lines.push(
      `Advogado: ${advEmpregado || "_______________"} - OAB ${oabEmpregado || "___________"}`
    );
    lines.push("");
    lines.push(
      `REQUERIDO (EMPREGADOR): ${empresa || "_______________"}, CNPJ ${cnpj || "__.___.___/____-__"},`
    );
    lines.push(`com sede em ${enderecoEmpregador || "_______________"}.`);
    lines.push(
      `Advogado: ${advEmpregador || "_______________"} - OAB ${oabEmpregador || "___________"}`
    );
    lines.push("");
    lines.push("DO VINCULO");
    lines.push(
      `Periodo: ${formatDataBR(dataAdmissao)} a ${formatDataBR(dataDemissao)}`
    );
    lines.push("");
    lines.push("DAS VERBAS ACORDADAS");

    verbas.forEach((v, i) => {
      if (v.descricao || v.valor > 0) {
        lines.push(
          `${i + 1}. ${v.descricao || "Verba"}: ${formatCurrency(v.valor)}`
        );
      }
    });

    lines.push(`Valor Total: ${formatCurrency(totalVerbas)}`);
    lines.push("");
    lines.push("DA FORMA DE PAGAMENTO");

    if (formaPagamento === "avista") {
      lines.push(
        `O valor sera pago em parcela unica de ${formatCurrency(totalVerbas)} no ato da homologacao.`
      );
    } else {
      lines.push(
        `O valor sera pago em ${numeroParcelas} parcelas de ${formatCurrency(valorParcela)}, mensais e consecutivas.`
      );
    }

    lines.push("");
    lines.push("DA QUITACAO");

    if (tipoQuitacao === "geral") {
      lines.push(
        "As partes dao mutua e irrevogavel quitacao geral de todos os direitos e obrigacoes decorrentes do contrato de trabalho."
      );
    } else {
      lines.push(
        "A quitacao restringe-se exclusivamente as verbas acima especificadas, nao abrangendo outros eventuais direitos."
      );
    }

    lines.push("");
    lines.push("DA MULTA");
    lines.push(
      `Em caso de descumprimento, a parte inadimplente pagara multa de ${percentualMulta}% sobre o valor total do acordo.`
    );
    lines.push("");
    lines.push(`${cidadeStr}, ${dataStr}`);
    lines.push("");
    lines.push("");
    lines.push(
      "____________________________        ____________________________"
    );
    lines.push(
      `${nomeEmpregado || "Empregado"}                    ${empresa || "Empregador"}`
    );
    lines.push(
      `CPF: ${cpfEmpregado || "___.___.___-__"}                          CNPJ: ${cnpj || "__.___.___/____-__"}`
    );
    lines.push("");
    lines.push(
      "____________________________        ____________________________"
    );
    lines.push(
      "Advogado Empregado                  Advogado Empregador"
    );
    lines.push(
      `OAB: ${oabEmpregado || "___________"}                          OAB: ${oabEmpregador || "___________"}`
    );

    return lines;
  }, [
    cidade,
    dataAtual,
    nomeEmpregado,
    profissao,
    cpfEmpregado,
    ctps,
    serie,
    enderecoEmpregado,
    advEmpregado,
    oabEmpregado,
    empresa,
    cnpj,
    enderecoEmpregador,
    advEmpregador,
    oabEmpregador,
    dataAdmissao,
    dataDemissao,
    verbas,
    totalVerbas,
    formaPagamento,
    numeroParcelas,
    valorParcela,
    tipoQuitacao,
    percentualMulta,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Courier);
    const fontBold = await doc.embedFont(StandardFonts.CourierBold);
    const { width, height } = page.getSize();

    let y = height - 60;
    const margin = 60;
    const contentWidth = width - margin * 2;
    const fontSize = 10;
    const lineHeight = 15;

    page.drawText("ZATTAR ADVOGADOS", {
      x: margin,
      y,
      size: 9,
      font: fontBold,
      color: rgb(0.5, 0.3, 0.8),
    });
    y -= 30;

    const lines = buildDocumentLines();
    const titleLines = [
      "PETICAO DE HOMOLOGACAO DE ACORDO EXTRAJUDICIAL",
      "(Art. 855-B da CLT)",
      "DO VINCULO",
      "DAS VERBAS ACORDADAS",
      "DA FORMA DE PAGAMENTO",
      "DA QUITACAO",
      "DA MULTA",
    ];

    for (const line of lines) {
      if (y < 40) break;

      if (line === "") {
        y -= lineHeight;
        continue;
      }

      const isTitle = titleLines.includes(line);
      const selectedFont = isTitle ? fontBold : font;
      const selectedSize = isTitle ? 11 : fontSize;

      const words = line.split(" ");
      let currentLine = "";
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (selectedFont.widthOfTextAtSize(test, selectedSize) > contentWidth) {
          page.drawText(currentLine, {
            x: margin,
            y,
            size: selectedSize,
            font: selectedFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: selectedSize,
          font: selectedFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= lineHeight;
      }
    }

    page.drawText(
      "Este modelo tem carater informativo. Este acordo requer homologacao judicial para ter validade.",
      {
        x: margin,
        y: 30,
        size: 7,
        font,
        color: rgb(0.6, 0.6, 0.6),
      }
    );

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acordo-extrajudicial.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [buildDocumentLines]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Acordo Extrajudicial - Zattar Advogados",
        text: "Gere sua peticao de acordo extrajudicial gratuitamente.",
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Warning obrigatorio */}
          <div className="bg-portal-danger-soft border border-portal-danger/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-portal-danger shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-portal-danger text-sm uppercase tracking-wider mb-2">
                  Requisito Obrigatorio
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Cada parte (empregado e empregador) deve ser representada por
                  advogado proprio e distinto (Art. 855-B CLT). Este acordo
                  necessita de homologacao judicial para ter validade.
                </p>
              </div>
            </div>
          </div>

          {/* Secao: Dados do Empregado */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border/30">
              Dados do Empregado
            </p>
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Nome Completo</label>
            <input
              type="text"
              value={nomeEmpregado}
              onChange={(e) => setNomeEmpregado(e.target.value)}
              placeholder="Maria da Silva"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>CPF</label>
            <input
              type="text"
              value={cpfEmpregado}
              onChange={(e) => setCpfEmpregado(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Profissao</label>
            <input
              type="text"
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              placeholder="Analista Administrativo"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className={labelCls}>CTPS</label>
              <input
                type="text"
                value={ctps}
                onChange={(e) => setCtps(e.target.value)}
                placeholder="000000"
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="space-y-3">
              <label className={labelCls}>Serie</label>
              <input
                type="text"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                placeholder="000"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Endereco do Empregado</label>
            <input
              type="text"
              value={enderecoEmpregado}
              onChange={(e) => setEnderecoEmpregado(e.target.value)}
              placeholder="Rua das Flores, 123 - Sao Paulo/SP"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Advogado do Empregado (Nome)</label>
            <input
              type="text"
              value={advEmpregado}
              onChange={(e) => setAdvEmpregado(e.target.value)}
              placeholder="Dr. Joao Pereira"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>OAB do Advogado do Empregado</label>
            <input
              type="text"
              value={oabEmpregado}
              onChange={(e) => setOabEmpregado(e.target.value)}
              placeholder="SP 123456"
              className={inputCls}
            />
          </div>

          {/* Secao: Dados do Empregador */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border/30">
              Dados do Empregador
            </p>
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Razao Social / Nome da Empresa</label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Empresa Exemplo LTDA"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Endereco do Empregador</label>
            <input
              type="text"
              value={enderecoEmpregador}
              onChange={(e) => setEnderecoEmpregador(e.target.value)}
              placeholder="Av. Paulista, 1000 - Sao Paulo/SP"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>Advogado do Empregador (Nome)</label>
            <input
              type="text"
              value={advEmpregador}
              onChange={(e) => setAdvEmpregador(e.target.value)}
              placeholder="Dra. Ana Lima"
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <label className={labelCls}>OAB do Advogado do Empregador</label>
            <input
              type="text"
              value={oabEmpregador}
              onChange={(e) => setOabEmpregador(e.target.value)}
              placeholder="SP 654321"
              className={inputCls}
            />
          </div>

          {/* Secao: Contrato */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border/30">
              Periodo Contratual
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className={labelCls}>Data de Admissao</label>
              <input
                type="date"
                value={dataAdmissao}
                onChange={(e) => setDataAdmissao(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="space-y-3">
              <label className={labelCls}>Data de Demissao</label>
              <input
                type="date"
                value={dataDemissao}
                onChange={(e) => setDataDemissao(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          {/* Tipo de quitacao */}
          <SelectOption
            label="Tipo de Quitacao"
            value={tipoQuitacao}
            onChange={setTipoQuitacao}
            options={[
              { value: "geral", label: "Geral (total)" },
              { value: "parcial", label: "Parcial (especifica)" },
            ]}
          />

          {/* Secao: Verbas Acordadas */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider pb-1 border-b border-border/30">
              Verbas Acordadas
            </p>
          </div>

          <div className="space-y-3">
            {verbas.map((verba, index) => (
              <div
                key={verba.id}
                className="bg-muted/50 rounded-lg p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Verba {index + 1}
                  </span>
                  {verbas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVerba(verba.id)}
                      className="w-6 h-6 rounded-full bg-portal-danger-soft hover:bg-portal-danger-soft/80 flex items-center justify-center transition-colors"
                      aria-label="Remover verba"
                    >
                      <X className="w-3 h-3 text-portal-danger" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={verba.descricao}
                  onChange={(e) =>
                    updateVerbaDescricao(verba.id, e.target.value)
                  }
                  placeholder="Descricao da verba (ex: Ferias proporcionais)"
                  className={inputCls}
                />
                <CurrencyInput
                  label="Valor"
                  value={verba.valorRaw}
                  onChange={(raw, parsed) =>
                    updateVerbaValor(verba.id, parsed, raw)
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVerba}
            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg p-3 text-sm font-medium text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Verba
          </button>

          {totalVerbas > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total das Verbas
              </span>
              <span className="font-bold text-foreground font-mono">
                {formatCurrency(totalVerbas)}
              </span>
            </div>
          )}

          {/* Forma de pagamento */}
          <SelectOption
            label="Forma de Pagamento"
            value={formaPagamento}
            onChange={setFormaPagamento}
            options={[
              { value: "avista", label: "A Vista" },
              { value: "parcelado", label: "Parcelado" },
            ]}
          />

          {formaPagamento === "parcelado" && (
            <div className="space-y-3">
              <label className={labelCls}>Numero de Parcelas</label>
              <input
                type="number"
                value={numeroParcelas}
                onChange={(e) =>
                  setNumeroParcelas(Math.max(2, parseInt(e.target.value) || 2))
                }
                min={2}
                max={60}
                className={`${inputCls} font-mono`}
              />
              {totalVerbas > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  Valor por parcela: {formatCurrency(valorParcela)}
                </p>
              )}
            </div>
          )}

          {/* Percentual de multa */}
          <div className="space-y-3">
            <label className={labelCls}>
              Percentual de Multa por Descumprimento
            </label>
            <div className="relative">
              <input
                type="number"
                value={percentualMulta}
                onChange={(e) =>
                  setPercentualMulta(
                    Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                  )
                }
                min={0}
                max={100}
                className={`${inputCls} font-mono pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                %
              </span>
            </div>
          </div>

          {/* Cidade */}
          <div className="space-y-3">
            <label className={labelCls}>Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Sao Paulo"
              className={inputCls}
            />
          </div>

          <VerifiedBadge text="Modelo verificado conforme Art. 855-B da CLT e praticas trabalhistas vigentes" />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">

              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-6 relative z-10">
                Visualizacao da Peticao
              </span>

              <div className="bg-muted/50 rounded-lg p-6 font-mono text-xs leading-relaxed text-foreground/80 relative z-10 space-y-4">
                {/* Titulo */}
                <div className="text-center space-y-1">
                  <p className="font-bold text-foreground text-sm tracking-wide">
                    PETICAO DE HOMOLOGACAO DE ACORDO EXTRAJUDICIAL
                  </p>
                  <p className="text-foreground/60">(Art. 855-B da CLT)</p>
                </div>

                {/* Empregado */}
                <div>
                  <p>
                    <Bold>REQUERENTE (EMPREGADO):</Bold>{" "}
                    {nomeEmpregado ? (
                      <Bold>{nomeEmpregado}</Bold>
                    ) : (
                      <Placeholder text="Nome" />
                    )}
                    ,{" "}
                    {profissao ? (
                      <Bold>{profissao}</Bold>
                    ) : (
                      <Placeholder text="Profissao" />
                    )}
                    , CPF{" "}
                    {cpfEmpregado ? (
                      <Bold>{cpfEmpregado}</Bold>
                    ) : (
                      <Placeholder text="000.000.000-00" />
                    )}
                    ,
                  </p>
                  <p>
                    CTPS{" "}
                    {ctps ? <Bold>{ctps}</Bold> : <Placeholder text="CTPS" />}{" "}
                    Serie{" "}
                    {serie ? (
                      <Bold>{serie}</Bold>
                    ) : (
                      <Placeholder text="Serie" />
                    )}
                    , residente em{" "}
                    {enderecoEmpregado ? (
                      <Bold>{enderecoEmpregado}</Bold>
                    ) : (
                      <Placeholder text="Endereco" />
                    )}
                    .
                  </p>
                  <p>
                    Advogado:{" "}
                    {advEmpregado ? (
                      <Bold>{advEmpregado}</Bold>
                    ) : (
                      <Placeholder text="Nome Advogado" />
                    )}{" "}
                    - OAB{" "}
                    {oabEmpregado ? (
                      <Bold>{oabEmpregado}</Bold>
                    ) : (
                      <Placeholder text="OAB" />
                    )}
                  </p>
                </div>

                {/* Empregador */}
                <div>
                  <p>
                    <Bold>REQUERIDO (EMPREGADOR):</Bold>{" "}
                    {empresa ? (
                      <Bold>{empresa}</Bold>
                    ) : (
                      <Placeholder text="Empresa" />
                    )}
                    , CNPJ{" "}
                    {cnpj ? (
                      <Bold>{cnpj}</Bold>
                    ) : (
                      <Placeholder text="00.000.000/0000-00" />
                    )}
                    ,
                  </p>
                  <p>
                    com sede em{" "}
                    {enderecoEmpregador ? (
                      <Bold>{enderecoEmpregador}</Bold>
                    ) : (
                      <Placeholder text="Endereco" />
                    )}
                    .
                  </p>
                  <p>
                    Advogado:{" "}
                    {advEmpregador ? (
                      <Bold>{advEmpregador}</Bold>
                    ) : (
                      <Placeholder text="Nome Advogado" />
                    )}{" "}
                    - OAB{" "}
                    {oabEmpregador ? (
                      <Bold>{oabEmpregador}</Bold>
                    ) : (
                      <Placeholder text="OAB" />
                    )}
                  </p>
                </div>

                {/* Vinculo */}
                <div className="pt-1 border-t border-border/20">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DO VINCULO
                  </p>
                  <p>
                    Periodo:{" "}
                    {dataAdmissao ? (
                      <Bold>{formatDataBR(dataAdmissao)}</Bold>
                    ) : (
                      <Placeholder text="Admissao" />
                    )}{" "}
                    a{" "}
                    {dataDemissao ? (
                      <Bold>{formatDataBR(dataDemissao)}</Bold>
                    ) : (
                      <Placeholder text="Demissao" />
                    )}
                  </p>
                </div>

                {/* Verbas */}
                <div className="pt-1 border-t border-border/20">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-2">
                    DAS VERBAS ACORDADAS
                  </p>
                  {verbas.length === 0 ||
                  verbas.every((v) => !v.descricao && v.valor === 0) ? (
                    <p>
                      <Placeholder text="Adicione as verbas acordadas" />
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {verbas.map((v, i) => (
                        <p key={v.id}>
                          {i + 1}.{" "}
                          {v.descricao ? (
                            <Bold>{v.descricao}</Bold>
                          ) : (
                            <Placeholder text="Descricao" />
                          )}
                          :{" "}
                          {v.valor > 0 ? (
                            <Bold>{formatCurrency(v.valor)}</Bold>
                          ) : (
                            <Placeholder text="R$ 0,00" />
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 pt-1 border-t border-border/20">
                    Valor Total:{" "}
                    <Bold>{formatCurrency(totalVerbas)}</Bold>
                  </p>
                </div>

                {/* Pagamento */}
                <div className="pt-1 border-t border-border/20">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DA FORMA DE PAGAMENTO
                  </p>
                  {formaPagamento === "avista" ? (
                    <p>
                      O valor sera pago em parcela unica de{" "}
                      <Bold>{formatCurrency(totalVerbas)}</Bold> no ato da
                      homologacao.
                    </p>
                  ) : (
                    <p>
                      O valor sera pago em{" "}
                      <Bold>{numeroParcelas} parcelas</Bold> de{" "}
                      <Bold>{formatCurrency(valorParcela)}</Bold>, mensais e
                      consecutivas.
                    </p>
                  )}
                </div>

                {/* Quitacao */}
                <div className="pt-1 border-t border-border/20">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DA QUITACAO
                  </p>
                  {tipoQuitacao === "geral" ? (
                    <p>
                      As partes dao mutua e irrevogavel quitacao geral de todos
                      os direitos e obrigacoes decorrentes do contrato de
                      trabalho.
                    </p>
                  ) : (
                    <p>
                      A quitacao restringe-se exclusivamente as verbas acima
                      especificadas, nao abrangendo outros eventuais direitos.
                    </p>
                  )}
                </div>

                {/* Multa */}
                <div className="pt-1 border-t border-border/20">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DA MULTA
                  </p>
                  <p>
                    Em caso de descumprimento, a parte inadimplente pagara multa
                    de <Bold>{percentualMulta}%</Bold> sobre o valor total do
                    acordo.
                  </p>
                </div>

                {/* Cidade e data */}
                <p className="pt-1">
                  {cidade ? (
                    <Bold>{cidade}</Bold>
                  ) : (
                    <Placeholder text="Cidade" />
                  )}
                  {", "}
                  <Bold>{formatDataExtenso(dataAtual)}</Bold>
                </p>

                {/* Assinaturas */}
                <div className="pt-2 border-t border-border/20 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p>____________________________</p>
                    <p>
                      {nomeEmpregado ? (
                        <Bold>{nomeEmpregado}</Bold>
                      ) : (
                        <Placeholder text="Nome Empregado" />
                      )}
                    </p>
                    <p>
                      CPF:{" "}
                      {cpfEmpregado ? (
                        <Bold>{cpfEmpregado}</Bold>
                      ) : (
                        <Placeholder text="000.000.000-00" />
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>____________________________</p>
                    <p>
                      {empresa ? (
                        <Bold>{empresa}</Bold>
                      ) : (
                        <Placeholder text="Nome Empresa" />
                      )}
                    </p>
                    <p>
                      CNPJ:{" "}
                      {cnpj ? (
                        <Bold>{cnpj}</Bold>
                      ) : (
                        <Placeholder text="00.000.000/0000-00" />
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p>____________________________</p>
                    <p>Advogado Empregado</p>
                    <p>
                      OAB:{" "}
                      {oabEmpregado ? (
                        <Bold>{oabEmpregado}</Bold>
                      ) : (
                        <Placeholder text="OAB" />
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>____________________________</p>
                    <p>Advogado Empregador</p>
                    <p>
                      OAB:{" "}
                      {oabEmpregador ? (
                        <Bold>{oabEmpregador}</Bold>
                      ) : (
                        <Placeholder text="OAB" />
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Disclaimer text="Este modelo tem carater informativo. Este acordo requer homologacao judicial para ter validade. Consulte um advogado trabalhista." />
            </CardContent>
          </Card>

          <ActionButtons onDownloadPDF={handleDownloadPDF} onShare={handleShare} />

          <CtaZattar
            title="Este acordo requer homologacao judicial"
            description="A Zattar pode representar voce neste processo, garantindo que seu acordo seja homologado com seguranca juridica total."
            buttonText="A Zattar pode representar voce"
          />
        </>
      }
    />
  );
}
