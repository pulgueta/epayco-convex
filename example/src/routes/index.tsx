import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowRight,
	CreditCard,
	Repeat,
	ShieldCheck,
	Split,
} from "lucide-react";
import { useState } from "react";
import { api } from "@cvx/_generated/api";
import { Price } from "@/components/money";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

const CAPABILITIES = [
	{
		icon: CreditCard,
		title: "Card checkout",
		copy: "Create a customer, tokenize a card and follow the transaction status reactively.",
		to: "#shop" as const,
		cta: "Shop and pay",
		className: "md:col-span-2 lg:col-span-6",
	},
	{
		icon: Split,
		title: "Split payments",
		copy: "Disperse one charge across a roaster, a grower co-op and logistics.",
		to: "/split" as const,
		cta: "Try a split",
		className: "md:col-span-1 lg:col-span-3",
	},
	{
		icon: Repeat,
		title: "Subscriptions",
		copy: "Create recurring plans with trials, sign-up and cancellation.",
		to: "/plans" as const,
		cta: "See plans",
		className: "md:col-span-1 lg:col-span-3",
	},
];

const FILTERS: { value: "all" | ProductCategory; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "coffee", label: "Coffee" },
	{ value: "gear", label: "Brew gear" },
];

function Home() {
	const products = useQuery(api.catalog.listProducts) as Product[] | undefined;
	const [filter, setFilter] = useState<"all" | ProductCategory>("all");

	const featured = products?.[0];
	const visible =
		filter === "all"
			? products
			: products?.filter((p) => p.category === filter);

	return (
		<>
			{/* Hero */}
			<section className="relative overflow-hidden">
				<div
					className="pointer-events-none absolute inset-0 -z-10"
					style={{
						backgroundImage:
							"radial-gradient(60% 60% at 85% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 60%)",
					}}
				/>
				<div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] md:py-20 lg:gap-16">
					<div>
						<p className="flex items-center gap-2 text-sm font-medium text-primary">
							<ShieldCheck className="size-4" />
							ePayco sandbox store
						</p>
						<h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
							Colombian coffee. Real payment flows.
						</h1>
						<p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
							Shop Tostado while testing card tokenization, split settlements
							and recurring billing against the ePayco sandbox.
						</p>
						<div className="mt-7 flex flex-wrap gap-3">
							<Button
								size="lg"
								className="h-11 px-5"
								// biome-ignore lint/a11y/useAnchorContent: we're using a custom anchor element
								render={<a href="#shop" />}
							>
								Explore the store
								<ArrowRight aria-hidden />
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="h-11 px-5"
								render={<Link to="/split" />}
							>
								Try split payments
								<ArrowRight />
							</Button>
						</div>
					</div>

					<div className="relative">
						{featured ? (
							<Link
								to="/products/$slug"
								params={{ slug: featured.id }}
								className="group/feature block"
							>
								<div className="relative overflow-hidden rounded-2xl ring-1 ring-foreground/10">
									<ProductVisual
										gradient={featured.gradient}
										icon={featured.icon}
										className="aspect-square w-full"
										iconClassName="size-24 transition-transform duration-700 group-hover/feature:scale-105"
									/>
									<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-6 pt-16">
										<p className="text-xs font-medium text-white/70">
											{featured.badge ?? "Featured"} from {featured.origin}
										</p>
										<p className="font-display mt-1 text-2xl font-medium text-white">
											{featured.name}
										</p>
										<p className="mt-1 text-sm text-white/80">
											From <Price value={featured.priceCop} />
										</p>
									</div>
								</div>
							</Link>
						) : (
							<Skeleton className="aspect-square w-full rounded-2xl" />
						)}
					</div>
				</div>
			</section>

			{/* Capability map */}
			<section className="border-y border-border bg-muted/30">
				<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
					<div className="max-w-2xl">
						<h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
							Try the component end to end
						</h2>
						<p className="mt-2 text-muted-foreground">
							Each route isolates one integration pattern while sharing the same
							customer, cards and reactive payment history.
						</p>
					</div>

					<div className="mt-8 grid grid-flow-dense grid-cols-1 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border md:grid-cols-2 lg:grid-cols-12">
						{CAPABILITIES.map((cap) => {
							const inner = (
								<>
									<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<cap.icon className="size-5" />
									</span>
									<h3 className="font-display mt-5 text-xl font-semibold">
										{cap.title}
									</h3>
									<p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
										{cap.copy}
									</p>
									<span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
										{cap.cta}
										<ArrowRight className="size-4 transition-transform group-hover/cap:translate-x-0.5" />
									</span>
								</>
							);
							const className = cn(
								"group/cap flex flex-col bg-card p-6 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:min-h-64 md:p-8",
								cap.className,
							);
							return cap.to.startsWith("#") ? (
								<a key={cap.title} href={cap.to} className={className}>
									{inner}
								</a>
							) : (
								<Link
									key={cap.title}
									to={cap.to as "/split" | "/plans"}
									className={className}
								>
									{inner}
								</Link>
							);
						})}
					</div>
				</div>
			</section>

			{/* Product grid */}
			<section
				id="shop"
				className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6"
			>
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h2 className="font-display text-3xl font-semibold tracking-tight">
							The roastery
						</h2>
						<p className="mt-1 text-muted-foreground">
							Freshly roasted to order. Prices in Colombian pesos.
						</p>
					</div>
					<div className="flex gap-1 rounded-lg border border-border bg-card p-1">
						{FILTERS.map((option) => (
							<button
								key={option.value}
								type="button"
								aria-pressed={filter === option.value}
								onClick={() => setFilter(option.value)}
								className={cn(
									"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
									filter === option.value
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				<div className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{visible
						? visible.map((product) => (
								<ProductCard key={product.id} product={product} />
							))
						: Array.from({ length: 8 }).map((_, index) => (
								<Skeleton
									key={index}
									className="aspect-[4/5] w-full rounded-xl"
								/>
							))}
				</div>
			</section>

			{/* Coffee Club band */}
			<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
				<div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
					<div className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-ember/30 blur-3xl" />
					<div className="relative max-w-xl">
						<h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
							Never run out. Join the Coffee Club.
						</h2>
						<p className="mt-3 text-primary-foreground/80">
							Pick a tier, get fresh beans on a schedule, and pause or cancel
							anytime. Subscriptions are powered by ePayco recurring plans.
						</p>
						<Button
							render={<Link to="/plans" />}
							size="lg"
							className="mt-6 h-11 bg-ember px-6 text-ember-foreground hover:bg-ember/90"
						>
							Explore plans
							<ArrowRight aria-hidden />
						</Button>
					</div>
				</div>
			</section>
		</>
	);
}
