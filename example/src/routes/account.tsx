import { createFileRoute, Link } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { CreditCard, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { RequireAuth } from "@/components/auth/require-auth";
import { Price } from "@/components/money";
import { PaymentStatusBadge } from "@/components/payment/payment-status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/errors";
import { paymentMethodLabel } from "@/lib/format";
import type {
	Me,
	PlanTier,
	SavedCard,
	Subscription,
	Transaction,
} from "@/lib/types";

export const Route = createFileRoute("/account")({ component: AccountRoute });

const dateFmt = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

function AccountRoute() {
	return (
		<RequireAuth
			title="Sign in to your account"
			description="See your orders, saved cards and Coffee Club subscription."
		>
			<AccountDashboard />
		</RequireAuth>
	);
}

function AccountDashboard() {
	const me = useQuery(api.account.getMe) as Me | undefined;

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
			<header>
				<h1 className="font-display text-3xl font-semibold tracking-tight">
					Your account
				</h1>
				{me?.email ? (
					<p className="mt-1 text-muted-foreground">{me.email}</p>
				) : null}
			</header>

			<div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
				<div className="grid gap-6">
					<SubscriptionPanel />
					<SavedCardsPanel />
				</div>
				<OrderHistoryPanel />
			</div>
		</div>
	);
}

function PanelShell({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-xl bg-card p-5 ring-1 ring-border">
			<h2 className="font-display text-lg font-medium">{title}</h2>
			<div className="mt-4">{children}</div>
		</section>
	);
}

function SubscriptionPanel() {
	const active = useQuery(api.account.getActiveSubscription) as
		| Subscription
		| null
		| undefined;
	const tiers = useQuery(api.subscriptions.listPlanTiers) as
		| PlanTier[]
		| undefined;
	const cancel = useAction(api.subscriptions.cancelSubscription);
	const [cancelling, setCancelling] = useState(false);

	async function handleCancel() {
		if (!active) return;
		setCancelling(true);
		try {
			await cancel({ epaycoSubscriptionId: active.epaycoSubscriptionId });
			toast.success("Subscription cancelled.");
		} catch (err) {
			toast.error(errorMessage(err));
		} finally {
			setCancelling(false);
		}
	}

	return (
		<PanelShell title="Coffee Club">
			{active === undefined ? (
				<Skeleton className="h-16 w-full" />
			) : active ? (
				<div className="grid gap-3">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">
								{tiers?.find((t) => t.id === active.epaycoPlanId)?.name ??
									"Coffee Club"}
							</p>
							<p className="text-xs text-muted-foreground capitalize">
								{active.status}
							</p>
						</div>
						<PaymentStatusBadge
							status={active.status === "active" ? "approved" : active.status}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleCancel}
						disabled={cancelling}
						aria-busy={cancelling}
						className="w-full text-destructive hover:text-destructive"
					>
						{cancelling ? <Loader2 className="animate-spin" aria-hidden /> : null}
						{cancelling ? "Cancelling…" : "Cancel subscription"}
					</Button>
				</div>
			) : (
				<div className="grid gap-3 text-sm">
					<p className="text-muted-foreground">No active subscription.</p>
					<Button asChild size="sm" variant="outline">
						<Link to="/plans">Browse plans</Link>
					</Button>
				</div>
			)}
		</PanelShell>
	);
}

function SavedCardsPanel() {
	const cards = useQuery(api.account.getLocalTokens) as SavedCard[] | undefined;

	return (
		<PanelShell title="Saved cards">
			{cards === undefined ? (
				<Skeleton className="h-12 w-full" />
			) : cards.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No saved cards yet. They appear after your first card payment.
				</p>
			) : (
				<ul className="grid gap-2">
					{cards.map((card) => (
						<li
							key={card._id}
							className="flex items-center gap-3 rounded-lg border border-border p-3"
						>
							<CreditCard className="size-4 text-muted-foreground" />
							<span className="text-sm font-medium">{card.mask}</span>
							<span className="ml-auto text-xs text-muted-foreground uppercase">
								{card.franchise}
							</span>
						</li>
					))}
				</ul>
			)}
		</PanelShell>
	);
}

function OrderHistoryPanel() {
	const transactions = useQuery(api.account.listTransactions, {}) as
		| Transaction[]
		| undefined;

	return (
		<PanelShell title="Order history">
			{transactions === undefined ? (
				<div className="grid gap-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<Skeleton key={index} className="h-16 w-full" />
					))}
				</div>
			) : transactions.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
						<Package className="size-5" />
					</span>
					<p className="text-sm text-muted-foreground">
						No orders yet. Your payments will show up here in real time.
					</p>
					<Button asChild size="sm">
						<Link to="/">Start shopping</Link>
					</Button>
				</div>
			) : (
				<ul className="divide-y divide-border">
					{transactions.map((tx) => (
						<li key={tx._id}>
							<Link
								to="/order/$ref"
								params={{ ref: tx.epaycoRef }}
								className="flex items-center gap-4 py-4 transition-colors hover:bg-muted/40"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate text-sm font-medium">
											{tx.description}
										</p>
										{tx.splitPayment ? (
											<span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
												Split
											</span>
										) : null}
									</div>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{dateFmt.format(tx._creationTime)} ·{" "}
										{paymentMethodLabel(tx.paymentMethod)} ·{" "}
										<span className="font-mono">{tx.epaycoRef}</span>
									</p>
								</div>
								<Price value={tx.amount} className="text-sm" />
								<PaymentStatusBadge status={tx.status} />
							</Link>
						</li>
					))}
				</ul>
			)}
		</PanelShell>
	);
}
