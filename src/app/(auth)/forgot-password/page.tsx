import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold font-heading mb-2">Recuperar Acesso</h2>
        <p className="text-white/30 text-sm">Insira seu e-mail para receber as instruções.</p>
      </div>
      <ForgotPasswordForm />
    </>
  )
}
