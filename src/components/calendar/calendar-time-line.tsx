'use client';

import { useEffect, useRef, useState } from "react";
import { useCalendar } from "@/components/calendar/calendar-context";
import { formatTime } from "@/components/calendar/helpers";

export function CalendarTimeline() {
	const { use24HourFormat } = useCalendar();
	const [currentTime, setCurrentTime] = useState(new Date());
	const timelineRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!timelineRef.current) return;

		const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
		const topPosition = (minutes / 1440) * 100;
		
		timelineRef.current.style.top = `${topPosition}%`;
	}, [currentTime]);

	const formatCurrentTime = () => {
		return formatTime(currentTime, use24HourFormat);
	};

	return (
		<div
			ref={timelineRef}
			className="pointer-events-none absolute inset-x-0 z-50 border-t border-primary"
		>
			<div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-primary"></div>

			<div className="absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-background pr-1 text-xs font-medium text-primary">
				{formatCurrentTime()}
			</div>
		</div>
	);
}
