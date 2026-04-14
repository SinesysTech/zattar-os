'use client'

/**
 * Auth Layout — Cinematic Runway
 *
 * Full-dark, sem card container. Grid lines com mask radial,
 * spotlights breathing, noise texture. Logo fixa no topo.
 * O form "emerge" do fundo escuro.
 */

import Image from 'next/image'

const Z_LIGHT = '/logos/Sem%20Fundo%20SVG/logo-z-light.svg'
const Z_DARK = '/logos/Sem%20Fundo%20SVG/logo-z-dark.svg'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark auth-runway relative min-h-svh flex items-center justify-center overflow-hidden">
      {/* Noise texture */}
      <div className="auth-noise" aria-hidden="true" />

      {/* Grid lines with radial mask */}
      <div className="auth-grid" aria-hidden="true" />

      {/* Spotlights */}
      <div className="auth-spotlight" aria-hidden="true" />
      <div className="auth-spotlight-warm" aria-hidden="true" />
      <div className="auth-edge-glow" aria-hidden="true" />

      {/* Fixed Z mark at top */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-20">
        <Image src={Z_DARK} alt="Z" width={40} height={40} priority className="h-10 w-10 dark:block hidden" />
        <Image src={Z_LIGHT} alt="Z" width={40} height={40} priority className="h-10 w-10 dark:hidden" />
      </div>

      {/* Content */}
      <main className="relative z-10 w-full max-w-100 px-4">
        {children}
      </main>
    </div>
  )
}
