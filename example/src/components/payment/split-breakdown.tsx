import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import { Price } from "@/components/money";
import type { SplitPartner, SplitReceiver } from "@/lib/types";

const COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

/**
 * Visualizes how one charge is dispersed across receivers. Receivers are zipped
 * with the partner list by index (the split action builds them in that order).
 */
export function SplitBreakdown({
	receivers,
	className,
}: {
	receivers: SplitReceiver[];
	className?: string;
}) {
	const partners = useQuery(api.payments.listSplitPartners) as
		| SplitPartner[]
		| undefined;
	const sum = receivers.reduce((total, r) => total + r.total, 0) || 1;

	return (
		<div className={className}>
			<div
				className="flex h-3 overflow-hidden rounded-full"
				role="img"
				aria-label="Payment split proportions"
			>
				{receivers.map((receiver, index) => (
					<div
						key={receiver.id + index}
						style={{
							width: `${(receiver.total / sum) * 100}%`,
							backgroundColor: COLORS[index % COLORS.length],
						}}
					/>
				))}
			</div>

			<ul className="mt-4 grid gap-3">
				{receivers.map((receiver, index) => {
					const partner = partners?.[index];
					const pct = Math.round((receiver.total / sum) * 100);
					return (
						<li key={receiver.id + index} className="flex items-center gap-3">
							<span
								className="size-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: COLORS[index % COLORS.length] }}
							/>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">
									{partner?.name ?? `Receiver ${index + 1}`}
								</p>
								{partner ? (
									<p className="text-xs text-muted-foreground">{partner.role}</p>
								) : null}
							</div>
							<span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
								{pct}%
							</span>
							<Price value={receiver.total} className="w-24 text-right text-sm" />
						</li>
					);
				})}
			</ul>
		</div>
	);
}
