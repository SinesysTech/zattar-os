'use client'

import type { ReactNode } from 'react'
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop'
import { PublicWizardHeader } from './public-wizard-header'
import { PublicWizardProgress, type PublicWizardStep } from './public-wizard-progress'

interface PublicWizardShellProps {
  steps: PublicWizardStep[]
  currentIndex: number
  onRestart?: () => void
  resumeHint?: string | null
  /** Tonalidade do backdrop. Default: 'primary' */
  tint?: 'primary' | 'success'
  children: ReactNode
}

export function PublicWizardShell({
  steps,
  currentIndex,
  onRestart,
  resumeHint,
  tint = 'primary',
  children,
}: PublicWizardShellProps) {
  const hasSteps = steps.length > 0

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <AmbientBackdrop blurIntensity={25} tint={tint} />

      <PublicWizardHeader />

      <div className="relative z-10 flex min-h-0 flex-1">
        {hasSteps && (
          <aside className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-outline-variant/20 bg-background/40 px-6 py-8 backdrop-blur-xl lg:flex">
            <PublicWizardProgress.Vertical
              steps={steps}
              currentIndex={currentIndex}
              onRestart={onRestart}
              resumeHint={resumeHint}
            />
          </aside>
        )}

        <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          {hasSteps && (
            <div className="shrink-0 border-b border-outline-variant/20 bg-background/60 backdrop-blur-xl lg:hidden">
              <PublicWizardProgress.Horizontal
                steps={steps}
                currentIndex={currentIndex}
                onRestart={onRestart}
                resumeHint={resumeHint}
              />
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  )
}
