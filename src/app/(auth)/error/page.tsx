import { AuthErrorV2 } from '@/components/auth/v2'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return <AuthErrorV2 error={params?.error} />
}
