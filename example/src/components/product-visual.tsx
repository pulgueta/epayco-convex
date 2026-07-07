import { createElement, type CSSProperties } from "react";
import { productIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Art-directed product imagery without stock photos: a rich two-stop gradient
 * (from the catalog) with a soft sheen and the product's motif icon. Cohesive,
 * self-contained, and works offline.
 */
export function ProductVisual({
	gradient,
	icon,
	className,
	iconClassName,
}: {
	gradient: [string, string];
	icon: string;
	className?: string;
	iconClassName?: string;
}) {
	const style: CSSProperties = {
		backgroundImage: `radial-gradient(125% 125% at 22% 12%, ${gradient[0]} 0%, ${gradient[1]} 72%)`,
	};

	return (
		<div
			className={cn("relative flex items-center justify-center overflow-hidden", className)}
			style={style}
			aria-hidden
		>
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_72%_88%,rgba(255,255,255,0.16),transparent_70%)]" />
			{createElement(productIcon(icon), {
				className: cn("size-14 text-white/90 drop-shadow-sm", iconClassName),
				strokeWidth: 1.25,
			})}
		</div>
	);
}
