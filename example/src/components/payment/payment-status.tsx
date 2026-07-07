import { CheckCircle2, CircleSlash, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { statusMeta, type StatusTone } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES: Record<StatusTone, { chip: string; Icon: LucideIcon }> = {
	success: {
		chip: "bg-primary/10 text-primary dark:bg-primary/15",
		Icon: CheckCircle2,
	},
	pending: {
		chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
		Icon: Clock,
	},
	danger: {
		chip: "bg-destructive/10 text-destructive",
		Icon: XCircle,
	},
	neutral: {
		chip: "bg-muted text-muted-foreground",
		Icon: CircleSlash,
	},
};

/** Status conveyed by icon + label + color together (never color alone). */
export function PaymentStatusBadge({
	status,
	className,
}: {
	status: string | undefined | null;
	className?: string;
}) {
	const meta = statusMeta(status);
	const { chip, Icon } = TONES[meta.tone];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
				chip,
				className,
			)}
		>
			<Icon className="size-3.5" aria-hidden />
			{meta.label}
		</span>
	);
}
