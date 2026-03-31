export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark relative flex min-h-svh items-center justify-center overflow-hidden bg-surface">
      {/* Animated gradient orbs */}
      <div
        className="pointer-events-none absolute -left-[10%] -top-[20%] h-[500px] w-[500px] rounded-full bg-primary/12 blur-[120px] animate-[drift_20s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-[25%] -right-[15%] h-[600px] w-[600px] rounded-full bg-primary/8 blur-[140px] animate-[drift_25s_ease-in-out_infinite_reverse]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm px-6 py-12">
        {children}
      </div>
    </div>
  )
}
