import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@cvx/_generated/api";
import { Price } from "@/components/money";
import { ProductVisual } from "@/components/product-visual";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function CartSheet() {
	const [open, setOpen] = useState(false);
	const { items, count, setQuantity, remove } = useCart();
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
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
					aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
				>
					<ShoppingBag />
					{count > 0 ? (
						<span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-semibold text-ember-foreground tabular-nums">
							{count}
						</span>
					) : null}
				</Button>
			</SheetTrigger>
			<SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
				<SheetHeader>
					<SheetTitle className="font-display text-xl">Your cart</SheetTitle>
					<SheetDescription>
						{count > 0
							? `${count} item${count === 1 ? "" : "s"}. Checkout is card-powered by ePayco.`
							: "Nothing here yet."}
					</SheetDescription>
				</SheetHeader>

				{lines.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
						<span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
							<ShoppingBag className="size-5" />
						</span>
						<p className="text-sm text-muted-foreground">
							Your cart is empty. Find a bag you love.
						</p>
						<SheetClose asChild>
							<Button asChild variant="outline">
								<Link to="/">Browse coffee</Link>
							</Button>
						</SheetClose>
					</div>
				) : (
					<>
						<div className="flex-1 overflow-y-auto px-4">
							<ul className="divide-y divide-border">
								{lines.map(({ product, quantity }) => (
									<li key={product.id} className="flex gap-3 py-4">
										<ProductVisual
											gradient={product.gradient}
											icon={product.icon}
											className="size-16 shrink-0 rounded-md"
											iconClassName="size-6"
										/>
										<div className="flex min-w-0 flex-1 flex-col gap-1">
											<div className="flex items-start justify-between gap-2">
												<p className="truncate text-sm font-medium">
													{product.name}
												</p>
												<button
													type="button"
													onClick={() => remove(product.id)}
													className="text-muted-foreground transition-colors hover:text-destructive"
													aria-label={`Remove ${product.name}`}
												>
													<Trash2 className="size-4" />
												</button>
											</div>
											<p className="text-xs text-muted-foreground">
												{product.weight}
											</p>
											<div className="mt-auto flex items-center justify-between">
												<div className="flex items-center rounded-md border border-input">
													<button
														type="button"
														className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
														onClick={() =>
															setQuantity(product.id, Math.max(1, quantity - 1))
														}
														disabled={quantity <= 1}
														aria-label="Decrease quantity"
													>
														<Minus className="size-3.5" />
													</button>
													<span className="w-7 text-center text-sm tabular-nums">
														{quantity}
													</span>
													<button
														type="button"
														className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
														onClick={() =>
															setQuantity(product.id, quantity + 1)
														}
														aria-label="Increase quantity"
													>
														<Plus className="size-3.5" />
													</button>
												</div>
												<Price value={product.priceCop * quantity} />
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>

						<SheetFooter className="gap-3 border-t">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<Price value={subtotal} className="text-base" />
							</div>
							<SheetClose asChild>
								<Button asChild size="lg" className="w-full">
									<Link to="/checkout">
										Checkout
										<ArrowRight />
									</Link>
								</Button>
							</SheetClose>
							<p className="text-center text-xs text-muted-foreground">
								Taxes shown at confirmation. Prices in COP.
							</p>
						</SheetFooter>
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
