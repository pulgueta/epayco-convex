import {
	Coffee,
	CupSoda,
	Filter,
	Flower2,
	Leaf,
	Milk,
	Sunrise,
	Thermometer,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Maps a product's `icon` string (from the catalog) to a lucide component. */
const PRODUCT_ICONS: Record<string, LucideIcon> = {
	Coffee,
	Sunrise,
	Leaf,
	Flower2,
	CupSoda,
	FilterIcon: Filter,
	Thermometer,
	Milk,
};

export function productIcon(name: string): LucideIcon {
	return PRODUCT_ICONS[name] ?? Coffee;
}

/** A small geometric coffee-bean seal used as the brand mark. */
export function Brandmark({ className }: { className?: string }) {
	return (
		<span
			className={cn(
				"inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground",
				className,
			)}
			aria-hidden
		>
			<svg viewBox="0 0 24 24" className="size-4" fill="none">
				<ellipse
					cx="12"
					cy="12"
					rx="6.5"
					ry="9"
					transform="rotate(38 12 12)"
					fill="currentColor"
				/>
				<path
					d="M8.5 6.5C12 9 12 15 15.5 17.5"
					stroke="var(--primary)"
					strokeWidth="1.4"
					strokeLinecap="round"
				/>
			</svg>
		</span>
	);
}

export function Wordmark({ className }: { className?: string }) {
	return (
		<span className={cn("flex items-center gap-2.5", className)}>
			<Brandmark />
			<span className="font-display text-xl font-semibold tracking-tight">
				Tostado
			</span>
		</span>
	);
}
