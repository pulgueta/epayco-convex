import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@cvx/_generated/api";
import { Price } from "@/components/money";
import { ProductVisual } from "@/components/product-visual";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

/** Read-only cart summary shared by checkout and split. The server recomputes
 *  the real total at charge time; this mirrors it for the buyer. */
export function OrderSummary({ title = "Order summary" }: { title?: string }) {
	const { items } = useCart();
	const products = useQuery(api.catalog.listProducts) as Product[] | undefined;

	const lines = useMemo(() => {
		if (!products) return [];
		return items
			.map((item) => {
				const product = products.find((p) => p.id === item.productId);
				return product ? { product, quantity: item.quantity } : null;
			})
			.filter((line): line is { product: Product; quantity: number } => !!line);
	}, [items, products]);

	const subtotal = lines.reduce(
		(sum, line) => sum + line.product.priceCop * line.quantity,
		0,
	);

	return (
		<div className="rounded-xl bg-card p-5 ring-1 ring-border">
			<h2 className="font-display text-lg font-medium">{title}</h2>

			<ul className="mt-4 grid gap-3">
				{products
					? lines.map(({ product, quantity }) => (
							<li key={product.id} className="flex items-center gap-3">
								<ProductVisual
									gradient={product.gradient}
									icon={product.icon}
									className="size-12 shrink-0 rounded-md"
									iconClassName="size-5"
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{product.name}</p>
									<p className="text-xs text-muted-foreground">
										Qty {quantity}
									</p>
								</div>
								<Price value={product.priceCop * quantity} className="text-sm" />
							</li>
						))
					: Array.from({ length: 2 }).map((_, index) => (
							<li key={index} className="flex items-center gap-3">
								<Skeleton className="size-12 rounded-md" />
								<Skeleton className="h-4 flex-1" />
							</li>
						))}
			</ul>

			<dl className="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
				<div className="flex justify-between">
					<dt className="text-muted-foreground">Subtotal</dt>
					<dd>
						<Price value={subtotal} />
					</dd>
				</div>
				<div className="flex justify-between">
					<dt className="text-muted-foreground">Shipping</dt>
					<dd className="text-muted-foreground">Free</dd>
				</div>
				<div className="flex justify-between border-t border-border pt-3 text-base font-medium">
					<dt>Total</dt>
					<dd>
						<Price value={subtotal} />
					</dd>
				</div>
			</dl>
		</div>
	);
}
