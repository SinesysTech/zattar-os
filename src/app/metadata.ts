import type { Metadata } from "next";

import { buildWebsiteMetadata } from "./website/_metadata/build-metadata";

/**
 * Metadata default herdada por rotas que não sobrescrevem.
 * Rotas públicas em src/app/website/* devem exportar seu próprio metadata
 * via buildWebsiteMetadata({ title, description, path }).
 */
export const metadata: Metadata = buildWebsiteMetadata({
  title: "Zattar Advogados — Justiça para quem trabalha",
  description:
    "Advocacia trabalhista com tecnologia de ponta. Defesa assertiva em rescisões, recuperação de FGTS e verbas, e suporte em acidentes de trabalho.",
  path: "/",
  absoluteTitle: true,
});
