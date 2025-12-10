"use client";

import { formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	buttonHover,
	transition,
} from "@/components/animations";
import { useCalendar } from "@/components/calendar-context";

import {
	getEventsCount,
	navigateDate,
	rangeText,
} from "@/components/helpers";

import type { IEvent } from "@/components/interfaces";
import type { TCalendarView } from "@/components/types";

interface IProps {
	view: TCalendarView;
	events: IEvent[];
}

const MotionButton = motion.create(Button);
const MotionBadge = motion.create(Badge);

// Usar useSyncExternalStore para evitar hydration mismatch
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function DateNavigator({ view, events }: IProps) {
	const { selectedDate, setSelectedDate } = useCalendar();
	// Usar useSyncExternalStore para detectar cliente vs servidor
	const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const month = formatDate(selectedDate, "MMMM", { locale: ptBR });
	const year = selectedDate.getFullYear();

	const eventCount = useMemo(
		() => (mounted ? getEventsCount(events, selectedDate, view) : 0),
		[events, selectedDate, view, mounted],
	);

	const handlePrevious = () =>
		setSelectedDate(navigateDate(selectedDate, view, "previous"));
	const handleNext = () =>
		setSelectedDate(navigateDate(selectedDate, view, "next"));

	return (
		<div className="space-y-0.5">
			<div className="flex items-center gap-2">
				<motion.span
					className="text-lg font-semibold"
					initial={{ x: -20, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={transition}
				>
					{month} {year}
				</motion.span>
				{mounted && (
					<AnimatePresence mode="wait">
						<MotionBadge
							key={eventCount}
							variant="secondary"
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							transition={transition}
						>
							{eventCount} {eventCount === 1 ? 'evento' : 'eventos'}
						</MotionBadge>
					</AnimatePresence>
				)}
			</div>

			<div className="flex items-center gap-2">
				<MotionButton
					variant="outline"
					size="icon"
					className="h-6 w-6"
					onClick={handlePrevious}
					variants={buttonHover}
					whileHover="hover"
					whileTap="tap"
				>
					<ChevronLeft className="h-4 w-4" />
				</MotionButton>

				<motion.p
					className="text-sm text-muted-foreground"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={transition}
				>
					{rangeText(view, selectedDate)}
				</motion.p>

				<MotionButton
					variant="outline"
					size="icon"
					className="h-6 w-6"
					onClick={handleNext}
					variants={buttonHover}
					whileHover="hover"
					whileTap="tap"
				>
					<ChevronRight className="h-4 w-4" />
				</MotionButton>
			</div>
		</div>
	);
}
