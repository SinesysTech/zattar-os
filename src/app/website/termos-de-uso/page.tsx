import type { Metadata } from "next";
import { FileText, AlertTriangle, Scale, Cpu, Globe, Ban } from "lucide-react";

import { WebsiteShell, LegalSection } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Termos de Uso | Zattar Advogados",
  description:
    "Leia os termos e condições de uso do website e do Portal do Cliente da Zattar Advogados.",
};

const sections = [
  {
    icon: Globe,
    title: "1. Aceitação dos Termos",
    content: [
      "Ao acessar e utilizar o website ou o Portal do Cliente da Zattar Advogados, você concorda com estes Termos de Uso na sua integralidade.",
      "Caso não concorde com alguma disposição, recomendamos que não utilize nossos serviços digitais e entre em contato diretamente pelo telefone ou e-mail.",
      "Estes termos podem ser atualizados periodicamente. A continuidade do uso após alterações implica aceitação das novas condições.",
    ],
  },
  {
    icon: Scale,
    title: "2. Natureza dos Serviços",
    content: [
      "O conteúdo disponibilizado neste website tem **caráter informativo** e não constitui, em nenhuma hipótese, assessoria ou orientação jurídica individualizada.",
      "A relação de advocacia é estabelecida exclusivamente mediante **contrato de honorários** firmado entre as partes.",
      "As calculadoras e ferramentas disponíveis no Portal são estimativas baseadas na legislação vigente e não substituem a análise profissional de um advogado.",
      "A Zattar Advogados atua exclusivamente na área de **Direito do Trabalho**, não prestando serviços em outras áreas jurídicas.",
    ],
  },
  {
    icon: Cpu,
    title: "3. Uso do Portal do Cliente",
    content: [
      "O acesso ao Portal é pessoal e intransferível. O cliente é responsável por manter a confidencialidade das suas credenciais de acesso.",
      "É vedado compartilhar dados de acesso com terceiros, incluindo familiares, salvo autorização expressa e formal ao escritório.",
      "O Portal deve ser utilizado exclusivamente para fins lícitos, relacionados ao acompanhamento do caso jurídico.",
      "Qualquer uso suspeito ou não autorizado deve ser reportado imediatamente ao escritório.",
    ],
  },
  {
    icon: Ban,
    title: "4. Limitações de Responsabilidade",
    content: [
      "A Zattar Advogados envida todos os esforços para manter as informações do website atualizadas, mas não garante a completude ou precisão em tempo real de todo o conteúdo.",
      "Não nos responsabilizamos por decisões tomadas com base exclusivamente no conteúdo informativo deste website, sem consulta prévia a um advogado.",
      "Enquanto fornecemos medidas de segurança robustas, não podemos garantir a absoluta invulnerabilidade de sistemas digitais a todas as ameaças cibernéticas.",
    ],
  },
  {
    icon: FileText,
    title: "5. Propriedade Intelectual",
    content: [
      "Todo o conteúdo deste website — textos, logotipos, imagens, design e código — é de propriedade exclusiva da Zattar Advogados ou de seus licenciadores.",
      "É **proibida** a reprodução, distribuição ou uso comercial de qualquer conteúdo sem autorização prévia e por escrito.",
      'O nome "Zattar Advogados", a logomarca e "Zattar OS" são marcas registradas ou em processo de registro.',
    ],
  },
  {
    icon: AlertTriangle,
    title: "6. Lei Aplicável e Foro",
    content: [
      "Estes Termos são regidos pelas leis da República Federativa do Brasil.",
      "Fica eleito o foro da comarca de **Belo Horizonte, Minas Gerais**, para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro.",
      "Em caso de dúvidas sobre estes Termos, entre em contato pelo e-mail **contato@zattaradvogados.com** ou pelo telefone **(31) 98438-2217**.",
    ],
  },
];

export default function TermosDeUsoPage() {
  return (
    <WebsiteShell>
      <div className="pt-32 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 mb-16 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <Text variant="marketing-overline">Termos &amp; Condições</Text>
          </div>
          <Heading level="marketing-hero" className="mb-6">
            Termos de{" "}
            <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
              Uso
            </span>
          </Heading>
          <Text variant="marketing-lead" className="max-w-2xl">
            Ao utilizar o website e o Portal do Cliente da Zattar Advogados,
            você concorda com as condições descritas abaixo. Leia com atenção
            antes de prosseguir.
          </Text>
          <Text variant="caption" className="text-foreground/60 mt-4">
            Última atualização: janeiro de 2025 · OAB/MG 128.404
          </Text>
        </section>

        {/* ─── Divider ─────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 mb-16">
          <div
            aria-hidden="true"
            className="h-px bg-linear-to-r from-transparent via-primary/20 to-transparent"
          />
        </div>

        {/* ─── Sections ─────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 space-y-6 md:space-y-8">
          {sections.map(({ icon, title, content }) => (
            <LegalSection key={title} icon={icon} title={title} items={content} />
          ))}
        </section>

        {/* ─── Footer note ─────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 mt-12">
          <div className="bg-surface-container-low/60 border border-outline-variant/20 rounded-2xl px-6 md:px-8 py-6 text-center">
            <Text variant="caption" className="text-foreground/70 leading-relaxed">
              Estes Termos de Uso foram elaborados em conformidade com o Código
              de Defesa do Consumidor (Lei nº 8.078/1990), o Marco Civil da
              Internet (Lei nº 12.965/2014) e a LGPD (Lei nº 13.709/2018). Para
              dúvidas:{" "}
              <a
                href="mailto:contato@zattaradvogados.com"
                className="text-primary hover:underline font-medium"
              >
                contato@zattaradvogados.com
              </a>
            </Text>
          </div>
        </div>
      </div>
    </WebsiteShell>
  );
}
