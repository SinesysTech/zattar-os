"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  CalculatorShell,
  NumberInput,
  CurrencyInput,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
} from "@/app/portal/feature/servicos";

// ─── Types ───────────────────────────────────────────────────────────────────

type IrregularidadeKey =
  | "atraso_salarial"
  | "fgts_nao_depositado"
  | "horas_extras_nao_pagas"
  | "ferias_nao_concedidas"
  | "descumprimento_convencao"
  | "assedio"
  | "insalubridade_sem_adicional"
  | "desvio_funcao";

const IRREGULARIDADES: { key: IrregularidadeKey; label: string }[] = [
  { key: "atraso_salarial", label: "Atraso no Pagamento de Salarios" },
  { key: "fgts_nao_depositado", label: "Nao Deposito do FGTS" },
  { key: "horas_extras_nao_pagas", label: "Horas Extras Nao Pagas" },
  { key: "ferias_nao_concedidas", label: "Ferias Nao Concedidas" },
  { key: "descumprimento_convencao", label: "Descumprimento de Convencao Coletiva" },
  { key: "assedio", label: "Assedio Moral" },
  { key: "insalubridade_sem_adicional", label: "Condicoes Insalubres sem Adicional" },
  { key: "desvio_funcao", label: "Desvio de Funcao" },
];

const FUNDAMENTOS_DIREITO: Record<IrregularidadeKey, string> = {
  atraso_salarial:
    "Art. 459 da CLT - o pagamento do salario deve ser efetuado ate o 5o dia util do mes subsequente.",
  fgts_nao_depositado:
    "Art. 15 da Lei 8.036/90 - obrigatoriedade do deposito mensal do FGTS.",
  horas_extras_nao_pagas:
    "Art. 59 da CLT - remuneracao das horas extras com acrescimo minimo de 50%.",
  ferias_nao_concedidas:
    "Art. 134 da CLT - ferias devem ser concedidas nos 12 meses subsequentes ao periodo aquisitivo.",
  assedio: "Art. 483, alineas 'a', 'b' e 'e' da CLT.",
  insalubridade_sem_adicional: "Art. 189-192 da CLT e NR-15.",
  desvio_funcao:
    "Art. 468 da CLT - vedacao de alteracao lesiva do contrato de trabalho.",
  descumprimento_convencao:
    "Art. 611-A da CLT e normas coletivas aplicaveis.",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatDataExtenso(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ─── Placeholder component ─────────────────────────────────────────────────

function Placeholder({ text }: { text: string }) {
  return <span className="text-muted-foreground/30 italic">[{text}]</span>;
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-foreground">{children}</span>;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NotificacaoExtrajudicialPage() {
  const [nomeNotificante, setNomeNotificante] = useState("");
  const [cpfNotificante, setCpfNotificante] = useState("");
  const [enderecoNotificante, setEnderecoNotificante] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [enderecoEmpresa, setEnderecoEmpresa] = useState("");
  const [irregularidades, setIrregularidades] = useState<Set<IrregularidadeKey>>(new Set());
  const [descricaoFatos, setDescricaoFatos] = useState("");
  const [valorCreditoRaw, setValorCreditoRaw] = useState("");
  const [valorCredito, setValorCredito] = useState(0);
  const [prazoRegularizacaoRaw, setPrazoRegularizacaoRaw] = useState("10");
  const [prazoRegularizacao, setPrazoRegularizacao] = useState(10);
  const [cidade, setCidade] = useState("");

  const dataAtual = useMemo(() => new Date(), []);

  const toggleIrregularidade = useCallback((key: IrregularidadeKey) => {
    setIrregularidades((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const irregularidadesSelecionadas = useMemo(
    () => IRREGULARIDADES.filter((i) => irregularidades.has(i.key)),
    [irregularidades]
  );

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const buildDocumentLines = useCallback(() => {
    const nomeStr = nomeNotificante || "_______________";
    const cpfStr = cpfNotificante || "___.___.___-__";
    const endNotifStr = enderecoNotificante || "_______________";
    const empresaStr = nomeEmpresa || "_______________";
    const cnpjStr = cnpjEmpresa || "__.___.___/____-__";
    const endEmpStr = enderecoEmpresa || "_______________";
    const cidadeStr = cidade || "___________";
    const dataStr = formatDataExtenso(dataAtual);
    const prazoStr = prazoRegularizacao.toString();
    const valorStr = valorCredito > 0 ? formatCurrency(valorCredito) : "R$ ___________";

    const lines: string[] = [];
    lines.push("NOTIFICACAO EXTRAJUDICIAL TRABALHISTA");
    lines.push("");
    lines.push(`NOTIFICANTE: ${nomeStr}, CPF ${cpfStr}, residente em ${endNotifStr}`);
    lines.push(`NOTIFICADO(A): ${empresaStr}, CNPJ ${cnpjStr}, com sede em ${endEmpStr}`);
    lines.push("");
    lines.push("DOS FATOS");
    lines.push(descricaoFatos.trim() || "_______________________________________________");
    lines.push("");

    if (irregularidadesSelecionadas.length > 0) {
      lines.push("DAS IRREGULARIDADES");
      irregularidadesSelecionadas.forEach((irr, idx) => {
        lines.push(`${idx + 1}. ${irr.label}`);
      });
      lines.push("");
      lines.push("DO DIREITO");
      irregularidadesSelecionadas.forEach((irr) => {
        lines.push(`- ${FUNDAMENTOS_DIREITO[irr.key]}`);
      });
      lines.push("");
    } else {
      lines.push("DAS IRREGULARIDADES");
      lines.push("_______________________________________________");
      lines.push("");
      lines.push("DO DIREITO");
      lines.push("_______________________________________________");
      lines.push("");
    }

    lines.push("DO PEDIDO");
    lines.push(
      `Pelo exposto, NOTIFICA V.Sa. para que, no prazo de ${prazoStr} dias, proceda a regularizacao das pendencias acima descritas, sob pena de adocao das medidas judiciais cabiveis, incluindo reclamacao trabalhista, cujo valor estimado do credito e de ${valorStr}.`
    );
    lines.push("");
    lines.push(`${cidadeStr}, ${dataStr}`);
    lines.push("");
    lines.push("____________________________");
    lines.push(nomeStr);
    lines.push(`CPF: ${cpfStr}`);

    return lines;
  }, [
    nomeNotificante,
    cpfNotificante,
    enderecoNotificante,
    nomeEmpresa,
    cnpjEmpresa,
    enderecoEmpresa,
    cidade,
    dataAtual,
    descricaoFatos,
    irregularidadesSelecionadas,
    valorCredito,
    prazoRegularizacao,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Courier);
    const fontBold = await doc.embedFont(StandardFonts.CourierBold);
    const { width, height } = page.getSize();

    let y = height - 60;
    const margin = 60;
    const contentWidth = width - margin * 2;
    const fontSize = 10;
    const lineHeight = 15;

    // Header
    page.drawText("ZATTAR ADVOGADOS", {
      x: margin,
      y,
      size: 9,
      font: fontBold,
      color: rgb(0.5, 0.3, 0.8),
    });
    y -= 30;

    const lines = buildDocumentLines();

    for (const line of lines) {
      if (y < 50) break;

      const isTitleLine =
        line === "NOTIFICACAO EXTRAJUDICIAL TRABALHISTA" ||
        line === "DOS FATOS" ||
        line === "DAS IRREGULARIDADES" ||
        line === "DO DIREITO" ||
        line === "DO PEDIDO";

      const selectedFont = isTitleLine ? fontBold : font;
      const selectedSize = isTitleLine ? 12 : fontSize;

      if (line === "") {
        y -= lineHeight;
        continue;
      }

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
          if (y < 50) break;
        } else {
          currentLine = test;
        }
      }
      if (currentLine && y >= 50) {
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

    const disclaimer =
      "Este modelo tem carater informativo. Recomenda-se consulta com advogado antes do envio.";
    page.drawText(disclaimer, {
      x: margin,
      y: 30,
      size: 7,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notificacao-extrajudicial-trabalhista.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [buildDocumentLines]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Notificacao Extrajudicial Trabalhista - Zattar Advogados",
        text: "Gere sua notificacao extrajudicial trabalhista gratuitamente.",
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
          {/* Nome do Notificante */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nome do Notificante (Empregado)
            </label>
            <input
              type="text"
              value={nomeNotificante}
              onChange={(e) => setNomeNotificante(e.target.value)}
              placeholder="Maria da Silva"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* CPF do Notificante */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              CPF do Notificante
            </label>
            <input
              type="text"
              value={cpfNotificante}
              onChange={(e) => setCpfNotificante(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Endereco do Notificante */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Endereco do Notificante
            </label>
            <input
              type="text"
              value={enderecoNotificante}
              onChange={(e) => setEnderecoNotificante(e.target.value)}
              placeholder="Rua das Flores, 100, Sao Paulo - SP"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Nome da Empresa */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nome da Empresa (Notificada)
            </label>
            <input
              type="text"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              placeholder="Empresa LTDA"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* CNPJ da Empresa */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              CNPJ da Empresa
            </label>
            <input
              type="text"
              value={cnpjEmpresa}
              onChange={(e) => setCnpjEmpresa(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Endereco da Empresa */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Endereco da Empresa
            </label>
            <input
              type="text"
              value={enderecoEmpresa}
              onChange={(e) => setEnderecoEmpresa(e.target.value)}
              placeholder="Av. Paulista, 1000, Sao Paulo - SP"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Irregularidades */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Irregularidades
            </label>
            <div className="grid grid-cols-1 gap-2">
              {IRREGULARIDADES.map((irr) => {
                const checked = irregularidades.has(irr.key);
                return (
                  <button
                    key={irr.key}
                    type="button"
                    onClick={() => toggleIrregularidade(irr.key)}
                    className={[
                      "flex items-center gap-3 rounded-lg p-3 text-left transition-all",
                      checked
                        ? "border border-primary bg-primary/5 text-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background",
                      ].join(" ")}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm leading-snug">{irr.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descricao dos Fatos */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Descricao dos Fatos
            </label>
            <textarea
              value={descricaoFatos}
              onChange={(e) => setDescricaoFatos(e.target.value)}
              placeholder="Descreva os fatos que fundamentam a notificacao..."
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm min-h-30 outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-y"
            />
          </div>

          {/* Valor Estimado do Credito */}
          <CurrencyInput
            label="Valor Estimado do Credito"
            value={valorCreditoRaw}
            onChange={(raw, parsed) => {
              setValorCreditoRaw(raw);
              setValorCredito(parsed);
            }}
          />

          {/* Prazo para Regularizacao */}
          <NumberInput
            label="Prazo para Regularizacao"
            value={prazoRegularizacaoRaw}
            onChange={(raw, parsed) => {
              setPrazoRegularizacaoRaw(raw);
              setPrazoRegularizacao(parsed > 0 ? parsed : 10);
            }}
            placeholder="10"
            suffix="dias"
          />

          {/* Cidade */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Cidade
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Sao Paulo"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Verified Badge */}
          <VerifiedBadge text="Modelo verificado conforme praticas trabalhistas vigentes" />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

              <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6 relative z-10">
                Visualizacao da Notificacao
              </span>

              {/* Document Preview */}
              <div className="bg-muted/50 rounded-lg p-6 font-mono text-xs leading-relaxed text-foreground/80 relative z-10 space-y-4">

                {/* Titulo */}
                <p className="font-bold text-foreground text-sm tracking-wide">
                  NOTIFICACAO EXTRAJUDICIAL TRABALHISTA
                </p>

                {/* Partes */}
                <div>
                  <p>
                    <span className="font-bold text-foreground">NOTIFICANTE:</span>{" "}
                    {nomeNotificante ? <Bold>{nomeNotificante}</Bold> : <Placeholder text="Nome do Notificante" />}
                    {", CPF "}
                    {cpfNotificante ? <Bold>{cpfNotificante}</Bold> : <Placeholder text="000.000.000-00" />}
                    {", residente em "}
                    {enderecoNotificante ? <Bold>{enderecoNotificante}</Bold> : <Placeholder text="Endereco" />}
                  </p>
                  <p>
                    <span className="font-bold text-foreground">NOTIFICADO(A):</span>{" "}
                    {nomeEmpresa ? <Bold>{nomeEmpresa}</Bold> : <Placeholder text="Nome da Empresa" />}
                    {", CNPJ "}
                    {cnpjEmpresa ? <Bold>{cnpjEmpresa}</Bold> : <Placeholder text="00.000.000/0000-00" />}
                    {", com sede em "}
                    {enderecoEmpresa ? <Bold>{enderecoEmpresa}</Bold> : <Placeholder text="Endereco da Empresa" />}
                  </p>
                </div>

                {/* Dos Fatos */}
                <div>
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DOS FATOS
                  </p>
                  <p>
                    {descricaoFatos.trim() ? (
                      <Bold>{descricaoFatos.trim()}</Bold>
                    ) : (
                      <Placeholder text="Descricao dos fatos" />
                    )}
                  </p>
                </div>

                {/* Das Irregularidades */}
                <div>
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DAS IRREGULARIDADES
                  </p>
                  {irregularidadesSelecionadas.length > 0 ? (
                    <ol className="list-none space-y-1">
                      {irregularidadesSelecionadas.map((irr, idx) => (
                        <li key={irr.key}>
                          <Bold>{idx + 1}. {irr.label}</Bold>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Placeholder text="Selecione as irregularidades" />
                  )}
                </div>

                {/* Do Direito */}
                <div>
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DO DIREITO
                  </p>
                  {irregularidadesSelecionadas.length > 0 ? (
                    <ul className="list-none space-y-1">
                      {irregularidadesSelecionadas.map((irr) => (
                        <li key={irr.key}>
                          - {FUNDAMENTOS_DIREITO[irr.key]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Placeholder text="Fundamentos legais aparecerao aqui" />
                  )}
                </div>

                {/* Do Pedido */}
                <div>
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-1">
                    DO PEDIDO
                  </p>
                  <p>
                    {"Pelo exposto, NOTIFICA V.Sa. para que, no prazo de "}
                    <Bold>{prazoRegularizacao} dias</Bold>
                    {", proceda a regularizacao das pendencias acima descritas, sob pena de adocao das medidas judiciais cabiveis, incluindo reclamacao trabalhista, cujo valor estimado do credito e de "}
                    {valorCredito > 0 ? (
                      <Bold>{formatCurrency(valorCredito)}</Bold>
                    ) : (
                      <Placeholder text="R$ valor" />
                    )}
                    {"."}
                  </p>
                </div>

                {/* Local e Data */}
                <p>
                  {cidade ? <Bold>{cidade}</Bold> : <Placeholder text="Cidade" />}
                  {", "}
                  <Bold>{formatDataExtenso(dataAtual)}</Bold>
                </p>

                {/* Assinatura */}
                <div className="pt-2">
                  <p>____________________________</p>
                  <p>
                    {nomeNotificante ? (
                      <Bold>{nomeNotificante}</Bold>
                    ) : (
                      <Placeholder text="Nome do Notificante" />
                    )}
                  </p>
                  <p>
                    CPF:{" "}
                    {cpfNotificante ? (
                      <Bold>{cpfNotificante}</Bold>
                    ) : (
                      <Placeholder text="000.000.000-00" />
                    )}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer text="Este modelo tem carater informativo. Recomenda-se consulta com advogado antes do envio." />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <ActionButtons onDownloadPDF={handleDownloadPDF} onShare={handleShare} />

          {/* CTA */}
          <CtaZattar
            title="Precisa de orientacao juridica?"
            description="Fale com um advogado da Zattar para garantir que sua notificacao extrajudicial esteja correta e proteja seus direitos trabalhistas."
            buttonText="Fale com a Zattar"
          />
        </>
      }
    />
  );
}
