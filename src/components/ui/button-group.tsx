import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import type { buttonVariants } from "@/components/ui/button";
import { cn, isReactFragment } from "@/lib/utils";

interface ButtonGroupProps {
	className?: string;
	orientation?: "horizontal" | "vertical";
	children: React.ReactNode;
}

export const ButtonGroup = ({
	className,
	orientation = "horizontal",
	children,
}: ButtonGroupProps) => {
	const isHorizontal = orientation === "horizontal";
	const isVertical = orientation === "vertical";

	// Processa children e filtra apenas elementos válidos
	const processedChildren = Children.toArray(children)
		.filter((child): child is ReactElement => {
			return isValidElement(child) && child !== null && child !== undefined;
		})
		.map((child, index, array) => {
			const isFirst = index === 0;
			const isLast = index === array.length - 1;

			// Se for ButtonGroupSeparator, renderiza como está
			if (
				typeof child.type === "function" &&
				(child.type as any)?.displayName === "ButtonGroupSeparator"
			) {
				return child;
			}

			// Fragment não aceita props como className, então pulamos
			if (isReactFragment(child)) {
				return child;
			}

			// Verifica se o child tem props válidas
			if (!child || !child.props) {
				return child;
			}

			// Aplica estilos apenas a elementos clonáveis (botões)
			const existingClassName = child.props?.className || undefined;

			return cloneElement(child, {
				className: cn(
					{
						"rounded-s-none": isHorizontal && !isFirst,
						"rounded-e-none": isHorizontal && !isLast,
						"border-s-0": isHorizontal && !isFirst,

						"rounded-t-none": isVertical && !isFirst,
						"rounded-b-none": isVertical && !isLast,
						"border-t-0": isVertical && !isFirst,
					},
					existingClassName,
				),
			});
		});

	return (
		<div
			className={cn(
				"flex",
				{
					"flex-col": isVertical,
					"w-fit": isVertical,
				},
				className,
			)}
		>
			{processedChildren}
		</div>
	);
};

interface ButtonGroupSeparatorProps {
	orientation?: "horizontal" | "vertical";
	className?: string;
}

export const ButtonGroupSeparator = ({
	orientation = "horizontal",
	className,
}: ButtonGroupSeparatorProps) => {
	const isHorizontal = orientation === "horizontal";

	return (
		<div
			className={cn(
				"bg-border",
				isHorizontal ? "w-px h-full" : "h-px w-full",
				className,
			)}
			aria-hidden="true"
		/>
	);
};

ButtonGroupSeparator.displayName = "ButtonGroupSeparator";