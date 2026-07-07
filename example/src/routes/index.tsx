import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowRight, CreditCard, Repeat, Split } from "lucide-react";
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
		title: "Tokenized card checkout",
		copy: "Tokenize, create a customer, charge — and follow the transaction live.",
		to: "#shop" as const,
		cta: "Add to cart",
	},
	{
		icon: Split,
		title: "Split payments",
		copy: "Disperse one charge across a roaster, a grower co-op and logistics.",
		to: "/split" as const,
		cta: "Try a split",
	},
	{
		icon: Repeat,
		title: "Subscriptions",
		copy: "Recurring Coffee Club plans with trials, sign-up and cancellation.",
		to: "/plans" as const,
		cta: "See plans",
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
				<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
					<div>
						<span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
							<span className="size-1.5 rounded-full bg-primary" />
							ePayco × Convex · live sandbox demo
						</span>
						<h1 className="font-display mt-5 text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl">
							Coffee worth the wait.
						</h1>
						<p className="mt-5 max-w-md text-base text-pretty text-muted-foreground sm:text-lg">
							Tostado roasts single-origin Colombian coffee in small batches.
							This storefront is also a working demo of the ePayco Convex
							component — card checkout, split payments and subscriptions.
						</p>
						<div className="mt-7 flex flex-wrap gap-3">
							<Button asChild size="lg" className="h-11 px-6">
								<a href="#shop">
									Shop the roastery
									<ArrowRight />
								</a>
							</Button>
							<Button asChild size="lg" variant="outline" className="h-11 px-6">
								<Link to="/plans">Join the Coffee Club</Link>
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
											{featured.badge ?? "Featured"} · {featured.origin}
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

			{/* Capability band */}
			<section className="border-y border-border bg-muted/30">
				<div className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
					{CAPABILITIES.map((cap) => {
						const inner = (
							<>
								<cap.icon className="size-5 text-primary" />
								<h3 className="font-medium">{cap.title}</h3>
								<p className="text-sm text-muted-foreground">{cap.copy}</p>
								<span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-foreground">
									{cap.cta}
									<ArrowRight className="size-4 transition-transform group-hover/cap:translate-x-0.5" />
								</span>
							</>
						);
						const className = "group/cap flex flex-col gap-2 px-2 py-7 md:px-8";
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
			</section>

			{/* Product grid */}
			<section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
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

				<div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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
			<section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
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
							asChild
							size="lg"
							className="mt-6 h-11 bg-ember px-6 text-ember-foreground hover:bg-ember/90"
						>
							<Link to="/plans">
								Explore plans
								<ArrowRight />
							</Link>
						</Button>
					</div>
				</div>
			</section>
		</>
	);
}
