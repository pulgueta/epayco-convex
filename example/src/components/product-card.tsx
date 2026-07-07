import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Price } from "@/components/money";
import { ProductVisual } from "@/components/product-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
	const { add } = useCart();

	return (
		<article className="group/card relative flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:ring-foreground/20">
			<Link
				to="/products/$slug"
				params={{ slug: product.id }}
				className="block rounded-t-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
				aria-label={product.name}
			>
				<ProductVisual
					gradient={product.gradient}
					icon={product.icon}
					className="aspect-[4/5] w-full"
					iconClassName="size-16 transition-transform duration-500 group-hover/card:scale-110"
				/>
			</Link>
			{product.badge ? (
				<Badge className="absolute top-3 left-3 bg-ember text-ember-foreground">
					{product.badge}
				</Badge>
			) : null}

			<div className="flex flex-1 flex-col p-4">
				<Link
					to="/products/$slug"
					params={{ slug: product.id }}
					className="font-display text-lg leading-tight font-medium underline-offset-4 hover:underline"
				>
					{product.name}
				</Link>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{product.origin} · {product.weight}
				</p>
				<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
					{product.blurb}
				</p>

				<div className="mt-4 flex items-center justify-between">
					<Price value={product.priceCop} className="text-base" />
					<Button
						size="sm"
						onClick={() => {
							add(product.id);
							toast.success(`Added ${product.name}`, {
								description: "It's in your cart.",
							});
						}}
					>
						<Plus />
						Add
					</Button>
				</div>
			</div>
		</article>
	);
}
