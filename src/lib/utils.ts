import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Metadata } from "next"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface GenerateMetaParams {
  title: string
  description?: string
  canonical?: string
  imageUrl?: string
  keywords?: string[]
  ogType?: string
}

export function generateMeta({
  title,
  description = title,
  canonical,
  imageUrl,
  keywords,
  ogType = "website",
}: GenerateMetaParams): Metadata {
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: ogType as "website" | "article" | "profile",
      url: canonical,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    alternates: canonical ? { canonical } : undefined,
  }
}
