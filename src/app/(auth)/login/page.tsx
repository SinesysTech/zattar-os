import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <>
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold font-heading mb-2">Acesso Restrito</h2>
        <p className="text-white/30 text-sm">Insira suas credenciais corporativas.</p>
      </div>
      <LoginForm />
    </>
  )
}
