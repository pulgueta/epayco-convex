import { createFileRoute, Link } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import {
	CreditCard,
	IdCard,
	Loader2,
	Package,
	Phone,
	UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { RequireAuth } from "@/components/auth/require-auth";
import { Price } from "@/components/money";
import { PaymentStatusBadge } from "@/components/payment/payment-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
			<header>
				<h1 className="font-display text-3xl font-semibold tracking-tight">
					{me?.firstName ? `${me.firstName}'s account` : "Your account"}
				</h1>
				{me?.email ? (
					<p className="mt-1 text-muted-foreground">{me.email}</p>
				) : null}
			</header>

			<div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
				<div className="grid gap-6">
					<ProfilePanel me={me} />
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
		<section>
			<Card>
				<CardHeader>
					<CardTitle className="font-display text-lg">{title}</CardTitle>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</section>
	);
}

function ProfilePanel({ me }: { me: Me | undefined }) {
	return (
		<PanelShell title="Customer profile">
			{me === undefined ? (
				<Skeleton className="h-24 w-full" />
			) : (
				<div className="grid gap-3 text-sm">
					<div className="flex items-center gap-3">
						<UserRound className="size-4 text-muted-foreground" />
						<span>{me?.name ?? "Profile name not saved"}</span>
					</div>
					<div className="flex items-center gap-3">
						<Phone className="size-4 text-muted-foreground" />
						<span>{me?.phone ?? "Mobile number not saved"}</span>
					</div>
					<div className="flex items-center gap-3">
						<IdCard className="size-4 text-muted-foreground" />
						<span>
							{me?.documentType && me.documentNumber
								? `${me.documentType} ${me.documentNumber}`
								: "Document not saved"}
						</span>
					</div>
					<p className="pt-1 text-xs leading-relaxed text-muted-foreground">
						These details are used to prefill ePayco billing fields.
					</p>
				</div>
			)}
		</PanelShell>
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
						{cancelling ? (
							<Loader2 className="animate-spin" aria-hidden />
						) : null}
						{cancelling ? "Cancelling..." : "Cancel subscription"}
					</Button>
				</div>
			) : (
				<div className="grid gap-3 text-sm">
					<p className="text-muted-foreground">No active subscription.</p>
					<Button size="sm" variant="outline" render={<Link to="/plans" />}>
						Browse plans
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
					<Button size="sm" render={<Link to="/" />}>
						Start shopping
					</Button>
				</div>
			) : (
				<ul className="divide-y divide-border">
					{transactions.map((tx) => (
						<li key={tx._id}>
							<Link
								to="/order/$ref"
								params={{ ref: tx.epaycoRef }}
								className="flex flex-col items-start gap-3 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4"
							>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="truncate text-sm font-medium">
											{tx.description}
										</p>
										{tx.splitPayment ? (
											<Badge
												variant="secondary"
												className="h-5 px-1.5 text-[10px]"
											>
												Split payment
											</Badge>
										) : null}
									</div>
									<p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
										<span>{dateFmt.format(tx._creationTime)}</span>
										<span>{paymentMethodLabel(tx.paymentMethod)}</span>
										<span className="font-mono">{tx.epaycoRef}</span>
									</p>
								</div>
								<div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
									<Price value={tx.amount} className="text-sm" />
									<PaymentStatusBadge status={tx.status} />
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</PanelShell>
	);
}
