'use client'

/**
 * AuthLayout V2 — "Átrio de Vidro" (Light Mode)
 *
 * Split layout aligned with the internal app's visual identity:
 * - LEFT: Brand canvas — sidebar-dark aesthetic with mesh aurora + live clock
 * - RIGHT: Light glass panel — matches dashboard (canvas-dots, glass-widget)
 *
 * The split mirrors the app's "dark sidebar + light content" architecture,
 * creating visual continuity from login → dashboard.
 */

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Time-Aware Ambient Colors ───────────────────────────────────────────────

interface TimeAmbience {
  greeting: string
  orb1: string
  orb2: string
  orb3: string
}

function getTimeAmbience(): TimeAmbience {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12)
    return {
      greeting: 'Bom dia.',
      orb1: 'bg-primary/15',
      orb2: 'bg-amber-500/10',
      orb3: 'bg-primary/10',
    }
  if (hour >= 12 && hour < 18)
    return {
      greeting: 'Boa tarde.',
      orb1: 'bg-primary/18',
      orb2: 'bg-sky-500/8',
      orb3: 'bg-primary/12',
    }
  return {
    greeting: 'Boa noite.',
    orb1: 'bg-primary/12',
    orb2: 'bg-indigo-500/10',
    orb3: 'bg-primary/8',
  }
}

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!time) return <div className="h-22" />

  return (
    <div className="text-center select-none" aria-hidden="true">
      <div className="text-6xl font-extralight tracking-tight text-white/25 tabular-nums font-mono">
        {time.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      <div className="text-[10px] mt-3 tracking-[4px] uppercase text-white/15 font-medium">
        {time.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </div>
    </div>
  )
}

// ─── Dark Canvas Panel (Brand / Sidebar aesthetic) ───────────────────────────

function BrandCanvas({ ambience }: { ambience: TimeAmbience }) {
  return (
    <div className="relative hidden lg:flex lg:flex-1 items-center justify-center overflow-hidden bg-[oklch(0.18_0.015_281)]">
      {/* Mesh Aurora orbs */}
      <div
        className={cn(
          'absolute h-150 w-150 rounded-full blur-[120px]',
          'motion-safe:animate-[mesh-drift-1_25s_ease-in-out_infinite]',
          ambience.orb1
        )}
        style={{ top: '-10%', left: '10%' }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute h-125 w-125 rounded-full blur-[100px]',
          'motion-safe:animate-[mesh-drift-2_30s_ease-in-out_infinite]',
          ambience.orb2
        )}
        style={{ bottom: '5%', right: '-5%' }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute h-100 w-100 rounded-full blur-[80px]',
          'motion-safe:animate-[mesh-drift-3_20s_ease-in-out_infinite]',
          ambience.orb3
        )}
        style={{ top: '40%', left: '50%' }}
        aria-hidden="true"
      />

      {/* Dot grid (white dots for dark bg) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.8) 0.5px, transparent 0.5px)',
          backgroundSize: '16px 16px',
        }}
        aria-hidden="true"
      />

      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Brand content */}
      <div className="relative z-10 flex flex-col items-center gap-14">
        <div className="relative h-14 w-14 opacity-60">
          <Image
            src="/logos/logo-small-dark.svg"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>
        <LiveClock />
        <p className="text-[10px] tracking-[5px] uppercase text-white/10 font-medium max-w-70 text-center leading-relaxed">
          Sua estação de trabalho jurídico
        </p>
      </div>
    </div>
  )
}

// ─── Light Glass Panel (Form / Dashboard aesthetic) ──────────────────────────

function LightGlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full lg:w-130 xl:w-140 flex items-center justify-center bg-background canvas-dots">
      {/* Subtle ambient gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.90 0.04 281 / 0.15), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Glass card container — matches internal glass-widget */}
      <div className="relative z-10 w-full max-w-95 px-6 py-12 lg:px-0">
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Layout (full light, no split) ────────────────────────────────────

function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex lg:hidden min-h-svh items-center justify-center bg-background canvas-dots">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 50% at 50% 20%, oklch(0.90 0.04 281 / 0.20), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-95 px-6 py-12">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export function AuthLayoutV2({ children }: { children: React.ReactNode }) {
  const [ambience] = useState(getTimeAmbience)

  return (
    <>
      {/* Desktop: split dark canvas + light glass panel */}
      <div className="hidden lg:flex min-h-svh">
        <BrandCanvas ambience={ambience} />
        <LightGlassPanel>{children}</LightGlassPanel>
      </div>

      {/* Mobile: full light with glass card */}
      <MobileLayout>{children}</MobileLayout>
    </>
  )
}
