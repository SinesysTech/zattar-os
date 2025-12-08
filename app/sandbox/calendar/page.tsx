import React, { Suspense } from "react";
import { Calendar } from "@/components/calendar";
import { CalendarSkeleton } from "@/components/calendar-skeleton";

export default function CalendarSandboxPage() {
	return (
		<div className="container mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Full Calendar - Validação</h1>
				<p className="text-muted-foreground mt-2">
					Página de teste para validar a instalação e funcionamento do
					componente Full Calendar
				</p>
			</div>

			<Suspense fallback={<CalendarSkeleton />}>
				<Calendar />
			</Suspense>
		</div>
	);
}

