import {
	SettingsIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useCalendar } from "@/components/calendar/calendar-context";
import { useDragDrop } from "@/components/calendar/dnd-context";

export function Settings() {
	const {
		badgeVariant,
		setBadgeVariant,
		use24HourFormat,
		toggleTimeFormat,
		agendaModeGroupBy,
		setAgendaModeGroupBy,
	} = useCalendar();
	const { showConfirmation, setShowConfirmation } = useDragDrop();
	const { theme, setTheme } = useTheme();

	const isDarkMode = theme === "dark";
	const isDotVariant = badgeVariant === "dot";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<SettingsIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>Configurações do Calendário</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						Usar modo escuro
						<DropdownMenuShortcut>
							<Switch
								checked={isDarkMode}
								onCheckedChange={(checked) =>
									setTheme(checked ? "dark" : "light")
								}
							/>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Mostrar diálogo de confirmação ao mover evento
						<DropdownMenuShortcut>
							<Switch
								checked={showConfirmation}
								onCheckedChange={(checked) => setShowConfirmation(checked)}
							/>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Usar badge pontual
						<DropdownMenuShortcut>
							<Switch
								checked={isDotVariant}
								onCheckedChange={(checked) =>
									setBadgeVariant(checked ? "dot" : "colored")
								}
							/>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Usar formato 24 horas
						<DropdownMenuShortcut>
							<Switch
								checked={use24HourFormat}
								onCheckedChange={toggleTimeFormat}
							/>
						</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuLabel>Agrupar agenda por</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={agendaModeGroupBy}
						onValueChange={(value) =>
							setAgendaModeGroupBy(value as "date" | "color")
						}
					>
						<DropdownMenuRadioItem value="date">Data</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="color">Cor</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
