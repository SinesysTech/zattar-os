"use server";

import { cookies } from "next/headers";
import { obterDashboardCliente } from "../service";
import { validarCpf } from "../utils";
import { redirect } from "next/navigation";
import { buscarClientePorDocumento } from "@/features/partes/service";

export type PortalLoginResult = { success: boolean; error?: string };

export async function validarCpfESetarSessao(
  cpf: string
): Promise<PortalLoginResult> {
  const validacao = validarCpf(cpf);
  if (!validacao.valido) return { success: false, error: validacao.erro };

  const result = await buscarClientePorDocumento(validacao.cpfLimpo);
  if (!result.success || !result.data)
    return { success: false, error: "Cliente não encontrado" };
  const cliente = result.data;

  // Set cookie de sessão sem 'expires' no payload, usando maxAge do cookie
  (await cookies()).set(
    "portal-cpf-session",
    JSON.stringify({
      cpf: validacao.cpfLimpo,
      nome: cliente.nome,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    }
  );

  return { success: true };
}

/**
 * Action chamada pelo formulário de login.
 * Em caso de sucesso, realiza o redirect (não retorna valor).
 * Em caso de erro, retorna objecto de erro.
 */
export async function actionLoginPortal(
  cpf: string
): Promise<PortalLoginResult | void> {
  const result = await validarCpfESetarSessao(cpf);

  if (!result.success) {
    return result;
  }

  redirect("/meu-processo/processos");
}

export async function actionValidarCpf(cpf: string) {
  // Mantida para compatibilidade ou uso direto sem redirect, mas recomenda-se usar actionLoginPortal
  return validarCpfESetarSessao(cpf);
}

export async function actionCarregarDashboard() {
  const session = (await cookies()).get("portal-cpf-session")?.value;
  if (!session) throw new Error("Sessão inválida");
  // Payload não tem mais 'expires'
  const { cpf } = JSON.parse(session);
  return obterDashboardCliente(cpf);
}

export async function actionLogout() {
  (await cookies()).delete("portal-cpf-session");
  (await cookies()).delete("portal_session");
  redirect("/meu-processo");
}
