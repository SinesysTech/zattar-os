'use client'

/**
 * AuthLayout V2 — Zero
 *
 * A tela de login É o app. Mesma linguagem visual do dashboard:
 * bg-background, canvas-dots, glass-widget card, ambient gradient.
 * Sem split, sem dark panel, sem gimmicks.
 */

export function AuthLayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background canvas-dots">
      {/* Ambient gradient — same technique as dashboard */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, oklch(0.90 0.04 281 / 0.20), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Glass card — matches glass-widget from dashboard */}
      <div className="relative z-10 w-full max-w-100 mx-4">
        <div className="glass-widget rounded-2xl border border-border/20 px-8 py-10 sm:px-10 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  )
}
