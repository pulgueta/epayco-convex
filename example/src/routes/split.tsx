import { usePayment } from "@pulgueta/epayco-convex/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";
import { Info, Users } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Price } from "@/components/money";
import {
	PaymentPanel,
	type PaymentPayload,
} from "@/components/payment/payment-panel";
import { SplitBreakdown } from "@/components/payment/split-breakdown";
import { ProductVisual } from "@/components/product-visual";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/errors";
import { formatCOP } from "@/lib/format";
import type { Product, SplitReceiver } from "@/lib/types";

export const Route = createFileRoute("/split")({ component: SplitRoute });

// A curated box whose single payment is dispersed across the supply chain.
const BOX_ITEMS = [
	{ productId: "huila-reserve", quantity: 1 },
	{ productId: "narino-sunrise", quantity: 1 },
	{ productId: "tolima-honey", quantity: 1 },
];

function SplitRoute() {
	const products = useQuery(api.catalog.listProducts) as Product[] | undefined;
	const navigate = useNavigate();
	const { execute, isLoading, error } = usePayment(api.payments.payWithSplit);

	const boxLines = useMemo(() => {
		if (!products) return [];
		return BOX_ITEMS.map((item) => {
			const product = products.find((p) => p.id === item.productId);
			return product ? { product, quantity: item.quantity } : null;
		}).filter((line): line is { product: Product; quantity: number } => !!line);
	}, [products]);

	const total = boxLines.reduce(
		(sum, line) => sum + line.product.priceCop * line.quantity,
		0,
	);

	// Preview the dispersion the same way the server allocates it: round each
	// share, last partner absorbs the remainder so the parts sum to the total.
	const partners = useQuery(api.payments.listSplitPartners) as
		| { id: string; percentage: number }[]
		| undefined;

	const previewReceivers: SplitReceiver[] = useMemo(() => {
		if (!partners || total === 0) return [];
		let allocated = 0;
		return partners.map((partner, index) => {
			const isLast = index === partners.length - 1;
			const amount = isLast
				? total - allocated
				: Math.round((total * partner.percentage) / 100);
			allocated += amount;
			return { id: partner.id, total: amount, iva: 0, base_iva: amount };
		});
	}, [partners, total]);

	async function handlePay(payload: PaymentPayload) {
		try {
			const result = (await execute({
				items: BOX_ITEMS,
				billing: payload.billing,
				card: payload.card,
				savedTokenId: payload.savedTokenId,
			})) as { refPayco: string | null } | null;
			const ref = result?.refPayco;
			if (ref) {
				void navigate({ to: "/order/$ref", params: { ref } });
			} else {
				toast.error("No payment reference was returned.");
			}
		} catch (err) {
			toast.error(errorMessage(err));
		}
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
			<div className="max-w-2xl">
				<span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
					<Users className="size-3.5" />
					Split payments
				</span>
				<h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-balance">
					One payment, shared fairly.
				</h1>
				<p className="mt-3 text-pretty text-muted-foreground">
					Buy a <strong className="text-foreground">Community Harvest</strong>{" "}
					box and ePayco disperses your single charge across everyone who made
					it — the roaster, the growers' cooperative, and last-mile logistics —
					in one transaction.
				</p>
			</div>

			<div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
				<div className="grid gap-6">
					<section className="rounded-xl bg-card p-5 ring-1 ring-border">
						<h2 className="font-display text-lg font-medium">
							The Community Harvest box
						</h2>
						<ul className="mt-4 grid gap-3">
							{products
								? boxLines.map(({ product, quantity }) => (
										<li key={product.id} className="flex items-center gap-3">
											<ProductVisual
												gradient={product.gradient}
												icon={product.icon}
												className="size-12 shrink-0 rounded-md"
												iconClassName="size-5"
											/>
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-medium">
													{product.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{product.origin}
												</p>
											</div>
											<Price
												value={product.priceCop * quantity}
												className="text-sm"
											/>
										</li>
									))
								: Array.from({ length: 3 }).map((_, index) => (
										<li key={index} className="flex items-center gap-3">
											<Skeleton className="size-12 rounded-md" />
											<Skeleton className="h-4 flex-1" />
										</li>
									))}
						</ul>
						<div className="mt-4 flex items-center justify-between border-t border-border pt-4">
							<span className="text-sm text-muted-foreground">Box total</span>
							<Price value={total} className="text-lg" />
						</div>
					</section>

					<section className="rounded-xl bg-card p-5 ring-1 ring-border">
						<h2 className="font-display text-lg font-medium">
							Where your money goes
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							The same charge, dispersed to three receivers.
						</p>
						{previewReceivers.length > 0 ? (
							<SplitBreakdown receivers={previewReceivers} className="mt-5" />
						) : (
							<Skeleton className="mt-5 h-32 w-full" />
						)}
						<p className="mt-5 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
							<Info className="mt-0.5 size-3.5 shrink-0" />
							In this demo, receiver merchant ids default to the store's sandbox
							account. In production each partner is a real ePayco merchant id
							(set via <code>EPAYCO_SPLIT_RECEIVER_*</code>).
						</p>
					</section>
				</div>

				<aside className="lg:sticky lg:top-20">
					<div className="rounded-xl bg-card p-5 ring-1 ring-border">
						<h2 className="font-display text-lg font-medium">
							Pay for the box
						</h2>
						<p className="mt-1 mb-5 text-sm text-muted-foreground">
							A single card charge, split on settlement.
						</p>
						<AuthLoading>
							<Skeleton className="h-72 w-full" />
						</AuthLoading>
						<Unauthenticated>
							<p className="mb-4 text-sm text-muted-foreground">
								Sign in to run a split charge on the sandbox.
							</p>
							<SignInForm />
						</Unauthenticated>
						<Authenticated>
							<PaymentPanel
								submitLabel={
									total > 0 ? `Pay & split ${formatCOP(total)}` : "Pay & split"
								}
								pending={isLoading}
								error={error ? errorMessage(error) : null}
								onPay={handlePay}
							/>
						</Authenticated>
					</div>
				</aside>
			</div>
		</div>
	);
}
