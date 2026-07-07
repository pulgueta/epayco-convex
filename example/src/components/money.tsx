import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A COP amount. Prices are the hero — strong, tabular, high-contrast ink. */
export function Price({
	value,
	className,
}: {
	value: number;
	className?: string;
}) {
	return (
		<span className={cn("font-medium tabular-nums", className)}>
			{formatCOP(value)}
		</span>
	);
}
