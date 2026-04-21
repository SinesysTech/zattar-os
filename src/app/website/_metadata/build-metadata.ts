/**
 * Helper de metadata para rotas públicas do website.
 * ============================================================================
 * Gera Metadata consistente (title, description, OG, Twitter, canonical)
 * a partir de campos mínimos. Usar em cada page.tsx de rota pública:
 *
 *   export const metadata = buildWebsiteMetadata({
 *     title: "Contato",
 *     description: "Fale com especialistas...",
 *     path: "/contato",
 *   });
 *
 * URL canonical é derivada de NEXT_PUBLIC_WEBSITE_URL (fallback: domínio .com).
 * ============================================================================
 */

import type { Metadata } from "next";

const SITE_NAME = "Zattar Advogados";
const SITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ??
  "https://zattaradvogados.com";
const DEFAULT_OG_IMAGE = "/website/og/default.jpg";

export interface BuildWebsiteMetadataInput {
  /** Título específico da rota (será prefixado ao nome do site). */
  title: string;
  /** Descrição de 140-160 caracteres. */
  description: string;
  /** Caminho começando com `/` — ex: `/contato`. */
  path: string;
  /** Path absoluto ou relativo à `public/` da imagem OG (1200x630). Opcional. */
  image?: string;
  /** Se true, o `title` é usado como está (sem prefixo "· Zattar Advogados"). */
  absoluteTitle?: boolean;
  /** Marca a rota como não-indexável. */
  noIndex?: boolean;
}

export function buildWebsiteMetadata({
  title,
  description,
  path,
  image,
  absoluteTitle,
  noIndex,
}: BuildWebsiteMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const absoluteImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "pt_BR",
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
