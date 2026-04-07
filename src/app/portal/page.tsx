import { AmbientBackdrop, BrandMark } from '@/components/shared'
import { CpfHeroForm } from './feature'

export default function PortalLoginPage() {
  return (
    <div className="dark">
      <div className="relative min-h-svh bg-surface text-on-surface font-sans overflow-hidden selection:bg-primary/30">
        <AmbientBackdrop />

        <main className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center px-6 py-6 sm:py-8">
          <div className="mb-6 flex justify-center sm:mb-8">
            <BrandMark variant="dark" size="xl" priority className="object-center" />
          </div>

          <CpfHeroForm />

          <p className="mt-8 text-center text-xs text-on-surface-variant/60">
            Zattar Advogados — Portal exclusivo de clientes
          </p>
        </main>
      </div>
    </div>
  )
}
