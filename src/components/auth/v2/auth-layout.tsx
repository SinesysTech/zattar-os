'use client'

/**
 * AuthLayout V2 — Zero
 *
 * A tela de login É o app. Mesma linguagem visual do dashboard:
 * bg-background, canvas-dots, glass-widget card, ambient gradient.
 * Sem split, sem dark panel, sem gimmicks.
 */

import { BrandMark } from '@/components/shared/brand-mark'
import { GlassPanel } from '@/components/shared/glass-panel'

export function AuthLayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background canvas-dots">
      {/* Ambient gradient — derivado do token --secondary com opacidade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, oklch(from var(--secondary) l c h / 0.20), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-100 mx-4">
        {/* Glass card — matches glass-widget from dashboard */}
        <GlassPanel className="px-8 py-10 sm:px-10 sm:py-12 w-full">
          <div className="flex justify-center mb-8">
            <BrandMark variant="auto" size="lg" priority />
          </div>
          {children}
        </GlassPanel>
      </div>
    </div>
  )
}
