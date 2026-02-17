import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/server";
import { getSystemBoardBySlug, SYSTEM_BOARD_DEFINITIONS } from "../../domain";
import * as tarefasService from "../../service";
import { SystemBoardClient } from "./system-board-client";

interface Props {
  params: Promise<{ boardSlug: string }>;
}

export function generateStaticParams() {
  return SYSTEM_BOARD_DEFINITIONS.map((b) => ({ boardSlug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardSlug } = await params;
  const board = getSystemBoardBySlug(boardSlug);
  return { title: board ? `Quadro — ${board.titulo}` : "Quadro" };
}

export default async function SystemBoardPage({ params }: Props) {
  const { boardSlug } = await params;
  const board = getSystemBoardBySlug(boardSlug);
  if (!board) notFound();

  const user = await getCurrentUser();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const isSuperAdmin = user.roles.includes("admin");

  const eventsResult = await tarefasService.listarEventosPorSource(
    user.id,
    isSuperAdmin,
    board.source
  );

  if (!eventsResult.success) {
    return <div className="p-6">Erro ao carregar: {eventsResult.error.message}</div>;
  }

  const quadrosResult = await tarefasService.listarQuadros(user.id);
  const quadros = quadrosResult.success ? quadrosResult.data : [];

  return (
    <SystemBoardClient
      board={board}
      events={eventsResult.data}
      quadros={quadros}
    />
  );
}
