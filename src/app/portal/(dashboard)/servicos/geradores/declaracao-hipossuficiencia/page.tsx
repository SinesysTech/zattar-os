"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import {
  CalculatorShell,
  ToggleOption,
  ActionButtons,
  VerifiedBadge,
  Disclaimer,
  CtaZattar,
} from "@/app/portal/feature/servicos";

// ─── Constants ───────────────────────────────────────────────────────────────

const TETO_INSS_2026 = 7786.02;
const LIMITE_HIPOSSUFICIENCIA = TETO_INSS_2026 * 0.4; // R$ 3.114,41

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(value: string): number {
  const clean = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
}

function formatDataExtenso(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Placeholder({ text }: { text: string }) {
  return (
    <span className="text-muted-foreground/30 italic">[{text}]</span>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-foreground">{children}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeclaracaoHipossuficienciaPage() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [endereco, setEndereco] = useState("");
  const [estaEmpregado, setEstaEmpregado] = useState(false);
  const [rendaMensal, setRendaMensal] = useState("");
  const [numeroDependentes, setNumeroDependentes] = useState("");
  const [cidade, setCidade] = useState("");

  const dataAtual = useMemo(() => new Date(), []);

  const rendaNum = parseCurrency(rendaMensal);
  const isElegivel = rendaNum > 0 && rendaNum <= LIMITE_HIPOSSUFICIENCIA;
  const rendaPreenchida = rendaMensal.trim() !== "";

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const buildDocumentLines = useCallback(() => {
    const nomeStr = nome || "_______________";
    const cpfStr = cpf || "___.___.___-__";
    const rgStr = rg || "___________";
    const enderecoStr = endereco || "_______________";
    const rendaStr = rendaNum > 0
      ? `R$ ${rendaNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "R$ ___________";
    const depStr = numeroDependentes || "0";
    const cidadeStr = cidade || "___________";
    const dataStr = formatDataExtenso(dataAtual);

    const lines: string[] = [];
    lines.push("DECLARACAO DE HIPOSSUFICIENCIA ECONOMICA");
    lines.push("");
    lines.push(
      `Eu, ${nomeStr}, portador(a) do CPF n. ${cpfStr} e RG n. ${rgStr}, residente e domiciliado(a) em ${enderecoStr}, DECLARO, para os devidos fins de direito, nos termos do Art. 790, §§3o e 4o da CLT c/c Art. 99 do CPC, que nao possuo condicoes financeiras de arcar com as custas processuais e honorarios advocaticios sem prejuizo do sustento proprio e de minha familia.`
    );
    lines.push("");

    if (estaEmpregado) {
      lines.push(
        `Declaro que exerco atividade remunerada, percebendo renda mensal de ${rendaStr}, e possuo ${depStr} dependente(s).`
      );
    } else {
      lines.push(
        `Declaro que me encontro atualmente desempregado(a), com renda familiar de ${rendaStr}, e possuo ${depStr} dependente(s).`
      );
    }
    lines.push("");

    lines.push(
      "Declaro estar ciente de que a falsidade desta declaracao configura crime de falsidade ideologica (Art. 299 do Codigo Penal), sujeitando-me as penas legais."
    );
    lines.push("");
    lines.push("Por ser verdade, firmo a presente declaracao.");
    lines.push("");
    lines.push(`${cidadeStr}, ${dataStr}`);
    lines.push("");
    lines.push("____________________________");
    lines.push(nomeStr);
    lines.push(`CPF: ${cpfStr}`);

    return lines;
  }, [nome, cpf, rg, endereco, estaEmpregado, rendaNum, numeroDependentes, cidade, dataAtual]);

  const handleDownloadPDF = useCallback(async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Courier);
    const fontBold = await doc.embedFont(StandardFonts.CourierBold);
    const { width, height } = page.getSize();

    let y = height - 60;
    const margin = 60;
    const contentWidth = width - margin * 2;
    const fontSize = 11;
    const lineHeight = 16;

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
      if (y < 60) break;

      const isTitle = line === "DECLARACAO DE HIPOSSUFICIENCIA ECONOMICA";
      const selectedFont = isTitle ? fontBold : font;
      const selectedSize = isTitle ? 13 : fontSize;

      if (line === "") {
        y -= lineHeight;
        continue;
      }

      // Word wrap
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

    // Disclaimer at bottom
    const disclaimer =
      "Este modelo tem carater informativo. Recomenda-se consulta com advogado antes do uso.";
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
    a.download = "declaracao-hipossuficiencia.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [buildDocumentLines]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Declaracao de Hipossuficiencia - Zattar Advogados",
        text: "Gere sua declaracao de hipossuficiencia economica gratuitamente.",
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  const rendaFormatada = rendaNum > 0
    ? `R$ ${rendaNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  const depNum = parseInt(numeroDependentes, 10);
  const depStr = !isNaN(depNum) && numeroDependentes !== "" ? depNum.toString() : null;

  return (
    <CalculatorShell
      inputPanel={
        <>
          {/* Nome Completo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Maria da Silva"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* CPF */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* RG */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              RG
            </label>
            <input
              type="text"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
              placeholder="00.000.000-0"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Endereco Completo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Endereco Completo
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua Exemplo, 123, Bairro, Cidade - UF, CEP"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Esta empregado */}
          <ToggleOption
            label="Esta empregado atualmente?"
            description="Marque se voce possui vinculo empregaticio ativo"
            checked={estaEmpregado}
            onChange={setEstaEmpregado}
          />

          {/* Renda Mensal */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Renda Mensal (pessoal ou familiar)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={rendaMensal}
                onChange={(e) => setRendaMensal(formatCurrency(e.target.value))}
                placeholder="0,00"
                className="w-full bg-muted border-none rounded-lg p-4 pl-10 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          </div>

          {/* Elegibility Info Card */}
          {rendaPreenchida && (
            <div
              className={`rounded-lg p-4 text-xs leading-relaxed border ${
                isElegivel
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
              }`}
            >
              {isElegivel ? (
                <>
                  <span className="font-bold block mb-1">Elegivel para justica gratuita</span>
                  Sua renda declarada de{" "}
                  <span className="font-bold">
                    R$ {rendaNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>{" "}
                  esta abaixo do limite de{" "}
                  <span className="font-bold">
                    R$ {LIMITE_HIPOSSUFICIENCIA.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>{" "}
                  (40% do teto INSS de 2026).
                </>
              ) : (
                <>
                  <span className="font-bold block mb-1">Atencao: renda acima do limite</span>
                  Sua renda declarada de{" "}
                  <span className="font-bold">
                    R$ {rendaNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>{" "}
                  esta acima do limite de{" "}
                  <span className="font-bold">
                    R$ {LIMITE_HIPOSSUFICIENCIA.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>{" "}
                  (40% do teto INSS). Consulte um advogado para avaliar sua situacao.
                </>
              )}
            </div>
          )}

          {/* Info Card (when renda not filled) */}
          {!rendaPreenchida && (
            <div className="rounded-lg p-4 text-xs leading-relaxed border bg-muted/50 border-border text-muted-foreground">
              <span className="font-bold block mb-1">Criterio de elegibilidade</span>
              Elegivel para justica gratuita se renda{" "}
              <span className="font-mono">{"<="} R$ 3.114,41/mes</span> em 2026 (40% do teto INSS
              de R$ 7.786,02).
            </div>
          )}

          {/* Numero de Dependentes */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Numero de Dependentes
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="99"
                value={numeroDependentes}
                onChange={(e) => setNumeroDependentes(e.target.value)}
                placeholder="0"
                className="w-full bg-muted border-none rounded-lg p-4 pr-16 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                dep.
              </span>
            </div>
          </div>

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
          <VerifiedBadge text="Modelo verificado conforme Art. 790 da CLT e Art. 99 do CPC" />
        </>
      }
      resultPanel={
        <>
          <Card>
            <CardContent className="p-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/10 blur-[70px] rounded-full pointer-events-none" />

              <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-6 relative z-10">
                Visualizacao da Declaracao
              </span>

              {/* Document Preview */}
              <div className="bg-muted/50 rounded-lg p-6 font-mono text-xs leading-relaxed text-foreground/80 relative z-10 space-y-4">
                {/* Titulo */}
                <p className="font-bold text-foreground text-sm tracking-wide">
                  DECLARACAO DE HIPOSSUFICIENCIA ECONOMICA
                </p>

                {/* Corpo principal */}
                <p>
                  Eu,{" "}
                  {nome ? <Bold>{nome}</Bold> : <Placeholder text="Nome Completo" />}
                  , portador(a) do CPF n.{" "}
                  {cpf ? <Bold>{cpf}</Bold> : <Placeholder text="000.000.000-00" />}
                  {" "}e RG n.{" "}
                  {rg ? <Bold>{rg}</Bold> : <Placeholder text="RG" />}
                  , residente e domiciliado(a) em{" "}
                  {endereco ? <Bold>{endereco}</Bold> : <Placeholder text="Endereco Completo" />}
                  , DECLARO, para os devidos fins de direito, nos termos do Art. 790, §§3o e 4o
                  da CLT c/c Art. 99 do CPC, que nao possuo condicoes financeiras de arcar com
                  as custas processuais e honorarios advocaticios sem prejuizo do sustento
                  proprio e de minha familia.
                </p>

                {/* Situacao de emprego */}
                {estaEmpregado ? (
                  <p>
                    Declaro que exerco atividade remunerada, percebendo renda mensal de{" "}
                    {rendaFormatada ? <Bold>{rendaFormatada}</Bold> : <Placeholder text="Renda" />}
                    , e possuo{" "}
                    {depStr !== null ? <Bold>{depStr}</Bold> : <Placeholder text="N" />}{" "}
                    dependente(s).
                  </p>
                ) : (
                  <p>
                    Declaro que me encontro atualmente desempregado(a), com renda familiar de{" "}
                    {rendaFormatada ? <Bold>{rendaFormatada}</Bold> : <Placeholder text="Renda" />}
                    , e possuo{" "}
                    {depStr !== null ? <Bold>{depStr}</Bold> : <Placeholder text="N" />}{" "}
                    dependente(s).
                  </p>
                )}

                {/* Advertencia legal */}
                <p>
                  Declaro estar ciente de que a falsidade desta declaracao configura crime de
                  falsidade ideologica (Art. 299 do Codigo Penal), sujeitando-me as penas legais.
                </p>

                <p>Por ser verdade, firmo a presente declaracao.</p>

                {/* Local e data */}
                <p>
                  {cidade ? <Bold>{cidade}</Bold> : <Placeholder text="Cidade" />}
                  {", "}
                  <Bold>{formatDataExtenso(dataAtual)}</Bold>
                </p>

                {/* Assinatura */}
                <div className="pt-2">
                  <p>____________________________</p>
                  <p>
                    {nome ? <Bold>{nome}</Bold> : <Placeholder text="Nome Completo" />}
                  </p>
                  <p>
                    CPF:{" "}
                    {cpf ? <Bold>{cpf}</Bold> : <Placeholder text="000.000.000-00" />}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <Disclaimer text="Este modelo tem carater informativo. Recomenda-se consulta com advogado antes do uso." />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <ActionButtons onDownloadPDF={handleDownloadPDF} onShare={handleShare} />

          {/* CTA */}
          <CtaZattar
            title="Precisa de orientacao juridica?"
            description="A Zattar Advogados pode avaliar seu caso e garantir que voce tenha acesso a justica gratuita com a representacao adequada."
            buttonText="Fale com a Zattar"
          />
        </>
      }
    />
  );
}
