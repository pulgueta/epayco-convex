import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { Price } from "@/components/money";
import { ProductVisual } from "@/components/product-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/products/$slug")({ component: ProductPage });

function ProductPage() {
	const { slug } = Route.useParams();
	const product = useQuery(api.catalog.getProduct, { id: slug }) as
		| Product
		| null
		| undefined;
	const { add } = useCart();
	const navigate = useNavigate();
	const [qty, setQty] = useState(1);

	if (product === undefined) {
		return (
			<div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
				<Skeleton className="aspect-square w-full rounded-2xl" />
				<div className="grid content-start gap-4">
					<Skeleton className="h-10 w-2/3" />
					<Skeleton className="h-5 w-1/3" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-11 w-48" />
				</div>
			</div>
		);
	}

	if (product === null) {
		return (
			<div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center">
				<h1 className="font-display text-3xl font-semibold">
					We couldn't find that.
				</h1>
				<p className="text-muted-foreground">
					This product may have sold out or moved.
				</p>
				<Button render={<Link to="/" />}>Back to the roastery</Button>
			</div>
		);
	}

	function addToCart() {
		add(product!.id, qty);
		toast.success(`Added ${qty} × ${product!.name}`, {
			description: "It's in your cart.",
		});
	}

	return (
		<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
			<Link
				to="/"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ChevronLeft className="size-4" />
				The roastery
			</Link>

			<div className="mt-6 grid gap-10 md:grid-cols-2">
				<div className="relative">
					<ProductVisual
						gradient={product.gradient}
						icon={product.icon}
						className="aspect-square w-full rounded-2xl ring-1 ring-foreground/10"
						iconClassName="size-28"
					/>
					{product.badge ? (
						<Badge className="absolute top-4 left-4 bg-ember text-ember-foreground">
							{product.badge}
						</Badge>
					) : null}
				</div>

				<div className="grid content-start gap-5">
					<div>
						<p className="text-sm text-muted-foreground">{product.origin}</p>
						<h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-balance">
							{product.name}
						</h1>
					</div>

					<Price value={product.priceCop} className="text-2xl" />

					<p className="max-w-prose text-pretty text-muted-foreground">
						{product.description}
					</p>

					{product.tasting.length > 0 ? (
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-sm font-medium">Tasting notes</span>
							{product.tasting.map((note) => (
								<Badge key={note} variant="secondary">
									{note}
								</Badge>
							))}
						</div>
					) : null}

					<dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-3">
						{product.specs.map((spec) => (
							<div key={spec.label} className="bg-card p-4">
								<dt className="text-xs text-muted-foreground">{spec.label}</dt>
								<dd className="mt-0.5 text-sm font-medium">{spec.value}</dd>
							</div>
						))}
					</dl>

					<div className="mt-1 flex flex-wrap items-center gap-3">
						<div className="flex items-center rounded-lg border border-input">
							<button
								type="button"
								className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => setQty((q) => Math.max(1, q - 1))}
								aria-label="Decrease quantity"
							>
								<Minus className="size-4" />
							</button>
							<span className="w-10 text-center font-medium tabular-nums">
								{qty}
							</span>
							<button
								type="button"
								className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
								onClick={() => setQty((q) => Math.min(99, q + 1))}
								aria-label="Increase quantity"
							>
								<Plus className="size-4" />
							</button>
						</div>

						<Button size="lg" className="h-10" onClick={addToCart}>
							<ShoppingBag />
							Add to cart
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="h-10"
							onClick={() => {
								add(product.id, qty);
								void navigate({ to: "/checkout" });
							}}
						>
							Buy now
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
