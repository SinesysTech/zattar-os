import { AuthError } from '@/components/auth/auth-error'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return <AuthError error={params?.error} />
}
