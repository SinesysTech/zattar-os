import { AuthLayoutV2 } from '@/components/auth/v2'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayoutV2>{children}</AuthLayoutV2>
}
