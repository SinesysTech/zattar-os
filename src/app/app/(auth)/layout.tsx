import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh">
      {/* ── Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden bg-sidebar">
        {/* Dark overlay for depth */}
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        {/* Primary gradient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[128px]"
          aria-hidden="true"
        />

        {/* Secondary gradient glow */}
        <div
          className="absolute -bottom-24 -left-24 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[100px]"
          aria-hidden="true"
        />

        {/* Edge separator */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px bg-linear-to-b from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-12">
          <Image
            src="/logos/logomarca-dark.svg"
            alt="Zattar Advogados"
            width={260}
            height={40}
            className="h-auto w-[260px] object-contain"
            priority
          />
          <div className="mt-5 h-px w-10 bg-primary/40" />
          <p className="mt-5 max-w-xs text-center text-base leading-relaxed text-sidebar-foreground/50">
            Plataforma integrada de gestão jurídica trabalhista
          </p>
        </div>

        {/* Copyright */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-sidebar-foreground/25">
            &copy; {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── Content Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  )
}
