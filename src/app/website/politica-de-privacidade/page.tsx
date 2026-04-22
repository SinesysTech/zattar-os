import type { Metadata } from "next";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";

import { WebsiteShell, LegalSection } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidade | Zattar Advogados",
  description:
    "Conheça como a Zattar Advogados coleta, utiliza e protege seus dados pessoais em conformidade com a LGPD.",
};

const sections = [
  {
    icon: Database,
    title: "Dados que Coletamos",
    content: [
      "**Dados de identificação:** nome completo, CPF, e-mail e telefone, fornecidos voluntariamente no formulário de contato ou no Portal do Cliente.",
      "**Dados processuais:** documentos e informações relacionadas ao seu caso jurídico, compartilhados exclusivamente para prestação de serviços advocatícios.",
      "**Dados de navegação:** endereço IP, tipo de navegador e páginas visitadas, coletados automaticamente para fins de segurança e melhoria do serviço.",
    ],
  },
  {
    icon: Eye,
    title: "Como Usamos seus Dados",
    content: [
      "**Prestação de serviços:** processamento e análise das informações necessárias para condução de processos jurídicos trabalhistas.",
      "**Comunicações:** envio de atualizações sobre seu processo, respostas a solicitações e notificações relevantes ao seu caso.",
      "**Melhoria dos serviços:** análise agregada e anonimizada para aprimorar a plataforma e garantir a melhor experiência ao cliente.",
      "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.",
    ],
  },
  {
    icon: Lock,
    title: "Como Protegemos seus Dados",
    content: [
      "Utilizamos **criptografia de ponta a ponta** para todos os dados em trânsito e em repouso.",
      "O acesso aos dados é restrito a advogados e colaboradores diretamente envolvidos no seu caso, sob dever de sigilo profissional.",
      "Nossa infraestrutura está em conformidade com padrões de segurança da informação compatíveis com a LGPD (Lei nº 13.709/2018).",
      "Realizamos auditorias periódicas de segurança e testes de vulnerabilidade para garantir a integridade dos dados.",
    ],
  },
  {
    icon: UserCheck,
    title: "Seus Direitos (LGPD)",
    content: [
      "**Acesso:** solicitar a confirmação e acesso aos seus dados pessoais que tratamos.",
      "**Correção:** requerer a correção de dados incompletos, inexatos ou desatualizados.",
      "**Eliminação:** solicitar a exclusão dos dados tratados com base no seu consentimento.",
      "**Portabilidade:** receber seus dados em formato estruturado e interoperável.",
      "**Revogação do consentimento:** retirar seu consentimento a qualquer momento, sem prejuízo do tratamento já realizado.",
    ],
  },
  {
    icon: Shield,
    title: "Retenção de Dados",
    content: [
      "Dados processuais são mantidos pelo prazo mínimo exigido pela legislação trabalhista e pelo Conselho Federal da OAB.",
      "Dados de contato são mantidos enquanto houver relação ativa ou por até **5 anos** após o encerramento do caso.",
      "Dados de navegação são retidos por até **12 meses** para fins de segurança.",
      "Após os prazos legais, os dados são eliminados de forma segura e irreversível.",
    ],
  },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <WebsiteShell>
      <div className="pt-32 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 mb-16 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <Text variant="marketing-overline">
              Privacidade &amp; Proteção de Dados
            </Text>
          </div>
          <Heading level="marketing-hero" className="mb-6">
            Política de{" "}
            <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
              Privacidade
            </span>
          </Heading>
          <Text variant="marketing-lead" className="max-w-2xl">
            A Zattar Advogados trata seus dados pessoais com rigor e
            transparência, em total conformidade com a Lei Geral de Proteção de
            Dados (LGPD — Lei nº 13.709/2018).
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

        {/* ─── Contact DPO ─────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 mt-12">
          <div className="bg-primary/10 border border-primary/25 rounded-2xl md:rounded-3xl px-6 md:px-10 py-7 md:py-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="grow">
              <Heading level="card" as="h3" className="mb-1">
                Encarregado de Dados (DPO)
              </Heading>
              <Text variant="caption" className="text-foreground/75 leading-relaxed">
                Para exercer seus direitos ou tirar dúvidas sobre o tratamento
                dos seus dados, entre em contato:
              </Text>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-xl h-12 px-6 text-sm shrink-0"
            >
              <a href="mailto:contato@zattaradvogados.com">
                contato@zattaradvogados.com
              </a>
            </Button>
          </div>
        </section>
      </div>
    </WebsiteShell>
  );
}
