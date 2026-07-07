import { usePayment } from "@pulgueta/epayco-convex/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { RequireAuth } from "@/components/auth/require-auth";
import { OrderSummary } from "@/components/payment/order-summary";
import {
	PaymentPanel,
	type PaymentPayload,
} from "@/components/payment/payment-panel";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { formatCOP } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/checkout")({ component: CheckoutRoute });

function CheckoutRoute() {
	return (
		<RequireAuth
			title="Sign in to check out"
			description="Your cart is saved. Sign in or create a demo account to pay."
		>
			<Checkout />
		</RequireAuth>
	);
}

function Checkout() {
	const { items, count, clear } = useCart();
	const products = useQuery(api.catalog.listProducts) as Product[] | undefined;
	const navigate = useNavigate();
	const { execute, isLoading, error } = usePayment(api.payments.payWithCard);

	if (count === 0) return <EmptyCart />;

	const total =
		products?.reduce((sum, product) => {
			const line = items.find((item) => item.productId === product.id);
			return line ? sum + product.priceCop * line.quantity : sum;
		}, 0) ?? 0;

	async function handlePay(payload: PaymentPayload) {
		try {
			const result = (await execute({
				items,
				billing: payload.billing,
				card: payload.card,
				savedTokenId: payload.savedTokenId,
			})) as { refPayco: string | null } | null;

			const ref = result?.refPayco;
			if (ref) {
				clear();
				void navigate({ to: "/order/$ref", params: { ref } });
			} else {
				toast.error("No payment reference was returned.", {
					description: "Please try again.",
				});
			}
		} catch (err) {
			toast.error(errorMessage(err));
		}
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
			<h1 className="font-display text-3xl font-semibold tracking-tight">
				Checkout
			</h1>
			<p className="mt-1 text-muted-foreground">
				Card payments are tokenized and charged through the ePayco sandbox.
			</p>

			<div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
				<div className="order-2 flex-1 lg:order-1">
					<PaymentPanel
						submitLabel={total > 0 ? `Pay ${formatCOP(total)}` : "Pay now"}
						pending={isLoading}
						error={error ? errorMessage(error) : null}
						onPay={handlePay}
					/>
					<p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
						<ShieldCheck className="size-3.5" />
						Card details are tokenized by ePayco and never stored on this server.
					</p>
				</div>

				<aside className="order-1 w-full lg:order-2 lg:sticky lg:top-20 lg:w-[360px]">
					<OrderSummary />
				</aside>
			</div>
		</div>
	);
}

function EmptyCart() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
			<span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
				<ShoppingBag className="size-6" />
			</span>
			<h1 className="font-display text-3xl font-semibold">
				Your cart is empty
			</h1>
			<p className="text-muted-foreground">
				Add a bag of coffee and come back to check out.
			</p>
			<Button asChild>
				<Link to="/">Browse the roastery</Link>
			</Button>
		</div>
	);
}
