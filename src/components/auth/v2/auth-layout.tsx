'use client'

/**
 * AuthLayout V2 — "Átrio de Vidro" (Refined)
 *
 * Split layout mirroring the app's "dark sidebar + light content" architecture.
 *
 * LEFT — Brand Canvas (sidebar-dark):
 *   - Aurora ribbon (horizontally stretched gradient band that breathes)
 *   - Mesh gradient orbs with warm accent (amber among purple)
 *   - Vignette layer for natural focal point
 *   - Edge glow line where panels meet
 *   - Premium noise grain (mix-blend-mode: overlay)
 *   - Live clock with pulsing colon, ultra-light weight
 *
 * RIGHT — Light Glass Panel (dashboard aesthetic):
 *   - canvas-dots background (same as dashboard)
 *   - glass-widget card (same blur, opacity, shadow as internal app)
 *   - Ambient purple gradient for depth
 */

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Time-Aware Ambient ──────────────────────────────────────────────────────

interface TimeAmbience {
  orb1: string
  orb2: string
  orbWarm: string
  aurora: string
}

function getTimeAmbience(): TimeAmbience {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12)
    return {
      orb1: 'bg-primary/14',
      orb2: 'bg-sky-600/6',
      orbWarm: 'bg-amber-500/8',
      aurora: 'oklch(0.30 0.12 300 / 0.25), oklch(0.28 0.10 260 / 0.20), oklch(0.25 0.08 40 / 0.10)',
    }
  if (hour >= 12 && hour < 18)
    return {
      orb1: 'bg-primary/16',
      orb2: 'bg-indigo-600/6',
      orbWarm: 'bg-amber-500/6',
      aurora: 'oklch(0.30 0.14 300 / 0.30), oklch(0.25 0.10 260 / 0.25), oklch(0.22 0.06 200 / 0.12)',
    }
  return {
    orb1: 'bg-primary/10',
    orb2: 'bg-indigo-600/8',
    orbWarm: 'bg-rose-500/5',
    aurora: 'oklch(0.25 0.12 300 / 0.20), oklch(0.22 0.08 270 / 0.18), oklch(0.20 0.06 320 / 0.10)',
  }
}

// ─── Live Clock (Premium Treatment) ─────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)
  const [colonVisible, setColonVisible] = useState(true)

  useEffect(() => {
    setTime(new Date())
    const tick = setInterval(() => setTime(new Date()), 1000)
    const blink = setInterval(() => setColonVisible((v) => !v), 1000)
    return () => {
      clearInterval(tick)
      clearInterval(blink)
    }
  }, [])

  if (!time) return <div className="h-24" />

  const hours = time.toLocaleTimeString('pt-BR', { hour: '2-digit' })
  const minutes = time.toLocaleTimeString('pt-BR', { minute: '2-digit' })

  return (
    <div className="text-center select-none" aria-hidden="true">
      {/* Time — ultra-light, high contrast */}
      <div className="text-7xl font-extralight tracking-[-0.03em] text-white/90 tabular-nums font-sans">
        <span>{hours}</span>
        <span
          className="inline-block w-6 text-center motion-safe:transition-opacity motion-safe:duration-500"
          style={{ opacity: colonVisible ? 0.9 : 0.15 }}
        >
          :
        </span>
        <span>{minutes}</span>
      </div>

      {/* Date */}
      <div className="text-[11px] mt-4 tracking-[0.2em] uppercase text-white/30 font-medium font-sans">
        {time.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </div>

      {/* Thin rule — structural anchor */}
      <div className="mx-auto mt-5 h-px w-10 bg-white/8" />
    </div>
  )
}

// ─── Dark Canvas Panel ───────────────────────────────────────────────────────

function BrandCanvas({ ambience }: { ambience: TimeAmbience }) {
  return (
    <div className="relative hidden lg:flex lg:flex-1 items-center justify-center overflow-hidden bg-[oklch(0.13_0.02_281)]">
      {/* Aurora ribbon — horizontal band of blended light */}
      <div
        className="absolute w-[150%] h-[35%] top-[32%] left-[-25%] motion-safe:animate-[aurora-shift_20s_ease-in-out_infinite_alternate]"
        style={{
          background: `linear-gradient(90deg, transparent, ${ambience.aurora}, transparent)`,
          filter: 'blur(70px)',
          transform: 'rotate(-4deg) scaleY(0.5)',
        }}
        aria-hidden="true"
      />

      {/* Mesh orbs — primary + cool + warm accent */}
      <div
        className={cn(
          'absolute h-[550px] w-[550px] rounded-full blur-[100px]',
          'motion-safe:animate-[mesh-drift-1_25s_ease-in-out_infinite]',
          ambience.orb1
        )}
        style={{ top: '-5%', left: '5%' }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute h-[400px] w-[400px] rounded-full blur-[90px]',
          'motion-safe:animate-[mesh-drift-2_30s_ease-in-out_infinite]',
          ambience.orb2
        )}
        style={{ bottom: '10%', right: '0%' }}
        aria-hidden="true"
      />
      {/* Warm accent orb — the "secret ingredient" for dimensionality */}
      <div
        className={cn(
          'absolute h-[350px] w-[350px] rounded-full blur-[100px]',
          'motion-safe:animate-[mesh-drift-3_22s_ease-in-out_infinite]',
          ambience.orbWarm
        )}
        style={{ top: '55%', left: '35%' }}
        aria-hidden="true"
      />

      {/* Vignette — darkened edges, brightened center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, oklch(0 0 0 / 0.45) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Noise grain — mix-blend-mode: overlay for film texture */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
        aria-hidden="true"
      />

      {/* Brand content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Logo */}
        <div className="relative h-12 w-12 opacity-70">
          <Image
            src="/logos/logo-small-dark.svg"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>

        {/* Clock */}
        <LiveClock />
      </div>

      {/* Edge glow — where canvas meets glass panel */}
      <div
        className="absolute top-0 right-0 w-px h-full z-20"
        style={{
          background:
            'linear-gradient(to bottom, oklch(1 0 0 / 0), oklch(1 0 0 / 0.06), oklch(1 0 0 / 0.10), oklch(1 0 0 / 0.06), oklch(1 0 0 / 0))',
        }}
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Light Glass Panel ───────────────────────────────────────────────────────

function LightGlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full lg:w-[520px] xl:w-[560px] flex items-center justify-center bg-background canvas-dots">
      {/* Ambient purple gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 40%, oklch(0.92 0.03 281 / 0.18), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Glass card — matches internal glass-widget exactly */}
      <div className="relative z-10 w-full max-w-[420px] px-6 py-12 lg:px-0">
        <div
          className="rounded-2xl px-8 py-10 sm:px-10 sm:py-12"
          style={{
            background: 'rgba(255, 255, 255, 0.62)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Layout ───────────────────────────────────────────────────────────

function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex lg:hidden min-h-svh items-center justify-center bg-background canvas-dots">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 50% at 50% 30%, oklch(0.92 0.03 281 / 0.20), transparent)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[420px] px-5 py-12">
        <div
          className="rounded-2xl px-8 py-10"
          style={{
            background: 'rgba(255, 255, 255, 0.62)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow:
              '0 4px 24px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
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
      <div className="hidden lg:flex min-h-svh">
        <BrandCanvas ambience={ambience} />
        <LightGlassPanel>{children}</LightGlassPanel>
      </div>
      <MobileLayout>{children}</MobileLayout>
    </>
  )
}
