'use client'

import { BrandMark } from '@/components/shared/brand-mark'

export function PublicWizardHeader() {
  return (
    <header className="shrink-0 border-b border-outline-variant/20 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-4 sm:px-6">
        <BrandMark variant="auto" size="custom" priority className="h-8 w-auto sm:h-9" />
      </div>
    </header>
  )
}
