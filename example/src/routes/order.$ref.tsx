import { useTransaction } from "@pulgueta/epayco-convex/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleSlash, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@cvx/_generated/api";
import { RequireAuth } from "@/components/auth/require-auth";
import { Price } from "@/components/money";
import { PaymentStatusBadge } from "@/components/payment/payment-status";
import { SplitBreakdown } from "@/components/payment/split-breakdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentMethodLabel, statusMeta, type StatusTone } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export const Route = createFileRoute("/order/$ref")({ component: OrderRoute });

function OrderRoute() {
	return (
		<RequireAuth
			title="Sign in to view this order"
			description="Orders are private to the account that placed them."
		>
			<OrderContent />
		</RequireAuth>
	);
}

const HERO: Record<StatusTone, { Icon: LucideIcon; ring: string; headline: string }> =
	{
		success: {
			Icon: CheckCircle2,
			ring: "text-primary",
			headline: "Thank you. Your payment was approved.",
		},
		pending: {
			Icon: Clock,
			ring: "text-amber-600 dark:text-amber-400",
			headline: "Your payment is processing.",
		},
		danger: {
			Icon: XCircle,
			ring: "text-destructive",
			headline: "That payment didn't go through.",
		},
		neutral: {
			Icon: CircleSlash,
			ring: "text-muted-foreground",
			headline: "Here's your order.",
		},
	};

function OrderContent() {
	const { ref } = Route.useParams();
	const transaction = useTransaction(api.account.getTransaction, {
		epaycoRef: ref,
	}) as Transaction | null | undefined;

	if (transaction === undefined) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
				<Skeleton className="mx-auto h-16 w-16 rounded-full" />
				<Skeleton className="mx-auto mt-6 h-8 w-2/3" />
				<Skeleton className="mt-8 h-56 w-full rounded-xl" />
			</div>
		);
	}

	if (transaction === null) {
		return (
			<div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
				<h1 className="font-display text-3xl font-semibold">
					We couldn't find that order.
				</h1>
				<p className="text-muted-foreground">
					Reference <code className="text-foreground">{ref}</code> isn't on your
					account.
				</p>
				<Button asChild>
					<Link to="/account">Your orders</Link>
				</Button>
			</div>
		);
	}

	const meta = statusMeta(transaction.status);
	const hero = HERO[meta.tone];

	return (
		<div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
			<div className="flex flex-col items-center text-center">
				<hero.Icon className={`size-14 ${hero.ring}`} strokeWidth={1.5} />
				<h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-balance">
					{hero.headline}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
			</div>

			<div className="mt-8 overflow-hidden rounded-xl bg-card ring-1 ring-border">
				<div className="flex items-center justify-between gap-3 border-b border-border p-5">
					<div>
						<p className="text-xs text-muted-foreground">Reference</p>
						<p className="font-mono text-sm">{transaction.epaycoRef}</p>
					</div>
					<PaymentStatusBadge status={transaction.status} />
				</div>

				<dl className="grid gap-3 p-5 text-sm">
					<Row label="Amount">
						<Price value={transaction.amount} className="text-base" />
					</Row>
					<Row label="Method">{paymentMethodLabel(transaction.paymentMethod)}</Row>
					<Row label="Description">
						<span className="text-right">{transaction.description}</span>
					</Row>
					{transaction.franchise ? (
						<Row label="Card">
							<span className="uppercase">{transaction.franchise}</span>
						</Row>
					) : null}
					{transaction.responseMessage ? (
						<Row label="Issuer">{transaction.responseMessage}</Row>
					) : null}
				</dl>

				{transaction.splitPayment && transaction.splitReceivers ? (
					<div className="border-t border-border p-5">
						<p className="text-sm font-medium">How this payment was split</p>
						<SplitBreakdown
							receivers={transaction.splitReceivers}
							className="mt-4"
						/>
					</div>
				) : null}
			</div>

			<div className="mt-6 flex flex-wrap justify-center gap-3">
				<Button asChild variant="outline">
					<Link to="/account">View all orders</Link>
				</Button>
				<Button asChild>
					<Link to="/">Keep shopping</Link>
				</Button>
			</div>
		</div>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="font-medium">{children}</dd>
		</div>
	);
}
