"use server";

import { cookies } from "next/headers";
import { obterDashboardCliente } from "../service";
import { validarCpf } from "../utils";
import { redirect } from "next/navigation";
import { buscarClientePorCpf } from "@/features/partes/service"; // Assuming this import path based on plan "de partes"

export async function actionValidarCpf(cpf: string) {
  const validacao = validarCpf(cpf);
  if (!validacao.valido) return { success: false, error: validacao.erro };

  const cliente = await buscarClientePorCpf(validacao.cpfLimpo);
  if (!cliente) return { success: false, error: "Cliente não encontrado" };

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

  redirect("/meu-processo/processos"); // Redirecting to processos as default dashboard view often starts there or strictly following plan it says redirect('/meu-processo') but commonly dashboard is inner. Plan says redirect('/meu-processo') in one place but usage in 2.2 suggests subpages. Re-reading plan: 2.1 says "redirect('/meu-processo')".
  // Wait, if I redirect to /meu-processo, it goes back to page.tsx which is the Hero/Login.
  // The plan middleware says: "if /meu-processo/* (except page.tsx)".
  // If /meu-processo renders the hero if no session, or dashboard if session?
  // The plan says "Hero/Login (page.tsx) permanece como entrada".
  // If I have a session, does page.tsx redirect to subpages?
  // The plan doesn't explicitly modify page.tsx to redirect if logged in, but usually it should.
  // However, I will follow the code provided in the plan for actionValidarCpf: `redirect('/meu-processo');`
  // Note: if I redirect to /meu-processo and it shows the Hero again, that's wrong.
  // But typically `page.tsx` checks session and redirects if present, or displays dashboard.
  // The plan says "Subpáginas ... usam Context API e componentes legados." -> "Converter para Server Components".
  // Let's stick to the code snippet provided in the plan.
  // "redirect('/meu-processo');" is what it wrote.
  // Actually, looking at the sequence diagram: "Set cookie + redirect /meu-processo/processos".
  // The diagram is more specific. I will use /meu-processo/processos.
}

export async function actionCarregarDashboard() {
  const session = cookies().get("portal-cpf-session")?.value;
  if (!session) throw new Error("Sessão inválida");
  const { cpf } = JSON.parse(session);
  return obterDashboardCliente(cpf);
}

export async function actionLogout() {
  cookies().delete("portal-cpf-session");
  redirect("/meu-processo");
}
