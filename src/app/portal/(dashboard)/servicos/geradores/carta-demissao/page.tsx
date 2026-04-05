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

// ─── Placeholder component ─────────────────────────────────────────────────

function Placeholder({ text }: { text: string }) {
  return (
    <span className="text-muted-foreground/30 italic">[{text}]</span>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-foreground">{children}</span>;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CartaDemissaoPage() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cargo, setCargo] = useState("");
  const [cumpriraAviso, setCumpriraAviso] = useState(false);
  const [dataUltimoDia, setDataUltimoDia] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cidade, setCidade] = useState("");

  const dataAtual = useMemo(() => new Date(), []);

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const buildLetterText = useCallback(() => {
    const cidadeStr = cidade || "___________";
    const dataStr = formatDataExtenso(dataAtual);
    const nomeStr = nome || "_______________";
    const cpfStr = cpf || "___.___.___-__";
    const empresaStr = empresa || "_______________";
    const cnpjStr = cnpj || "__.___.___/____-__";
    const cargoStr = cargo || "_______________";

    const lines: string[] = [];
    lines.push(`${cidadeStr}, ${dataStr}`);
    lines.push("");
    lines.push(`A/C ${empresaStr}`);
    lines.push(`CNPJ: ${cnpjStr}`);
    lines.push("");
    lines.push("PEDIDO DE DEMISSAO");
    lines.push("");
    lines.push(
      `Eu, ${nomeStr}, portador(a) do CPF ${cpfStr}, ocupante do cargo de ${cargoStr}, venho por meio desta comunicar minha decisao de rescindir o contrato de trabalho que mantenho com ${empresaStr}.`
    );
    lines.push("");

    if (cumpriraAviso) {
      const dataUltimoDiaStr = dataUltimoDia
        ? new Date(dataUltimoDia + "T00:00:00").toLocaleDateString("pt-BR")
        : "___/___/______";
      lines.push(
        `Comprometo-me a cumprir o aviso previo legal, permanecendo em minhas funcoes ate ${dataUltimoDiaStr}.`
      );
    } else {
      lines.push(
        "Solicito a dispensa do cumprimento do aviso previo, estando ciente de que o valor correspondente podera ser descontado de minhas verbas rescisorias."
      );
    }
    lines.push("");

    if (motivo.trim()) {
      lines.push(`Motivo: ${motivo.trim()}`);
      lines.push("");
    }

    lines.push(
      "Solicito que sejam providenciadas as devidas verbas rescisorias e a baixa na Carteira de Trabalho."
    );
    lines.push("");
    lines.push("Atenciosamente,");
    lines.push("");
    lines.push("____________________________");
    lines.push(nomeStr);
    lines.push(`CPF: ${cpfStr}`);
    lines.push("");
    lines.push("");
    lines.push("PROTOCOLO DE RECEBIMENTO");
    lines.push("");
    lines.push("Recebido em: ___/___/______");
    lines.push("");
    lines.push("____________________________");
    lines.push("Assinatura do Empregador");

    return lines;
  }, [nome, cpf, empresa, cnpj, cargo, cumpriraAviso, dataUltimoDia, motivo, cidade, dataAtual]);

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

    const lines = buildLetterText();

    for (const line of lines) {
      if (y < 40) {
        break;
      }

      const isTitle = line === "PEDIDO DE DEMISSAO" || line === "PROTOCOLO DE RECEBIMENTO";
      const selectedFont = isTitle ? fontBold : font;
      const selectedSize = isTitle ? 13 : fontSize;

      // Word wrap
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
    y -= 20;
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
    a.download = "carta-demissao.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }, [buildLetterText]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Carta de Demissao - Zattar Advogados",
        text: "Gere sua carta de demissao gratuitamente.",
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
          {/* Nome Completo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nome Completo do Empregado
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
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

          {/* Nome da Empresa */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Empresa LTDA"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* CNPJ */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              CNPJ da Empresa
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Cargo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Cargo Atual
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Analista Administrativo"
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          {/* Aviso Previo Toggle */}
          <ToggleOption
            label="Cumprira Aviso Previo?"
            description="Marque se voce pretende cumprir o periodo de aviso previo"
            checked={cumpriraAviso}
            onChange={setCumpriraAviso}
          />

          {/* Data Ultimo Dia (conditional) */}
          {cumpriraAviso && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Data do Ultimo Dia de Trabalho
              </label>
              <input
                type="date"
                value={dataUltimoDia}
                onChange={(e) => setDataUltimoDia(e.target.value)}
                className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Motivo (Opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva brevemente o motivo da demissao..."
              className="w-full bg-muted border-none rounded-lg p-4 text-foreground font-mono text-sm min-h-25 outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-y"
            />
          </div>

          {/* Cidade */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
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

              <span className="text-xs font-bold tracking-wider text-primary uppercase block mb-6 relative z-10">
                Visualizacao da Carta
              </span>

              {/* Document Preview */}
              <div className="bg-muted/50 rounded-lg p-6 font-mono text-xs leading-relaxed text-foreground/80 relative z-10 space-y-4">
                {/* Header: cidade + data */}
                <p>
                  {cidade ? <Bold>{cidade}</Bold> : <Placeholder text="Cidade" />}
                  {", "}
                  <Bold>{formatDataExtenso(dataAtual)}</Bold>
                </p>

                {/* Destinatario */}
                <div>
                  <p>
                    A/C{" "}
                    {empresa ? <Bold>{empresa}</Bold> : <Placeholder text="Nome da Empresa" />}
                  </p>
                  <p>
                    CNPJ:{" "}
                    {cnpj ? <Bold>{cnpj}</Bold> : <Placeholder text="00.000.000/0000-00" />}
                  </p>
                </div>

                {/* Titulo */}
                <p className="font-bold text-foreground text-sm tracking-wide">
                  PEDIDO DE DEMISSAO
                </p>

                {/* Corpo principal */}
                <p>
                  Eu,{" "}
                  {nome ? <Bold>{nome}</Bold> : <Placeholder text="Nome Completo" />}
                  , portador(a) do CPF{" "}
                  {cpf ? <Bold>{cpf}</Bold> : <Placeholder text="000.000.000-00" />}
                  , ocupante do cargo de{" "}
                  {cargo ? <Bold>{cargo}</Bold> : <Placeholder text="Cargo" />}
                  , venho por meio desta comunicar minha decisao de rescindir o contrato de
                  trabalho que mantenho com{" "}
                  {empresa ? <Bold>{empresa}</Bold> : <Placeholder text="Nome da Empresa" />}
                  .
                </p>

                {/* Aviso previo */}
                {cumpriraAviso ? (
                  <p>
                    Comprometo-me a cumprir o aviso previo legal, permanecendo em minhas funcoes
                    ate{" "}
                    {dataUltimoDia ? (
                      <Bold>
                        {new Date(dataUltimoDia + "T00:00:00").toLocaleDateString("pt-BR")}
                      </Bold>
                    ) : (
                      <Placeholder text="data" />
                    )}
                    .
                  </p>
                ) : (
                  <p>
                    Solicito a dispensa do cumprimento do aviso previo, estando ciente de que o
                    valor correspondente podera ser descontado de minhas verbas rescisorias.
                  </p>
                )}

                {/* Motivo */}
                {motivo.trim() && (
                  <p>
                    Motivo: <Bold>{motivo.trim()}</Bold>
                  </p>
                )}

                {/* Encerramento */}
                <p>
                  Solicito que sejam providenciadas as devidas verbas rescisorias e a baixa na
                  Carteira de Trabalho.
                </p>

                <p>Atenciosamente,</p>

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

                {/* Protocolo */}
                <div className="pt-4 border-t border-border/30">
                  <p className="font-bold text-foreground text-[11px] tracking-wide mb-2">
                    PROTOCOLO DE RECEBIMENTO
                  </p>
                  <p>Recebido em: ___/___/______</p>
                  <div className="pt-2">
                    <p>____________________________</p>
                    <p>Assinatura do Empregador</p>
                  </div>
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
            title="Precisa de orientacao?"
            description="Fale com um advogado da Zattar para garantir que sua carta de demissao esteja correta e proteja seus direitos."
            buttonText="Fale com a Zattar"
          />
        </>
      }
    />
  );
}
