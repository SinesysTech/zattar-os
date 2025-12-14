"use server";

import { cookies } from "next/headers";
import { obterDashboardCliente } from "../service";
import { validarCpf } from "../utils";
import { redirect } from "next/navigation";
import { buscarClientePorDocumento } from "@/features/partes/service";

export async function actionValidarCpf(cpf: string) {
  const validacao = validarCpf(cpf);
  if (!validacao.valido) return { success: false, error: validacao.erro };

  const result = await buscarClientePorDocumento(validacao.cpfLimpo);
  if (!result.success || !result.data)
    return { success: false, error: "Cliente não encontrado" };
  const cliente = result.data;

  // Set cookie de sessão
  cookies().set(
    "portal-cpf-session",
    JSON.stringify({
      cpf: validacao.cpfLimpo,
      nome: cliente.nome,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
    { httpOnly: true, secure: process.env.NODE_ENV === "production" }
  );

  redirect("/meu-processo/processos");
}

export async function actionCarregarDashboard() {
  const session = cookies().get("portal-cpf-session")?.value;
  if (!session) throw new Error("Sessão inválida");
  const { cpf } = JSON.parse(session);
  return obterDashboardCliente(cpf);
}

export async function actionLogout() {
  cookies().delete("portal-cpf-session");
  cookies().delete("portal_session"); // Clean up potentially old/alt named cookie if exists
  redirect("/meu-processo");
}
