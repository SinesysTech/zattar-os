import { DashboardView } from "@/features/portal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Magistrate AI",
  description: "Visão geral dos seus processos e contatos",
};

export default function DashboardPage() {
  return (
    <div className="w-full">
      <DashboardView />
    </div>
  );
}
