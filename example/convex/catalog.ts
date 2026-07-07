import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";

/**
 * The store catalog lives entirely on the server. The browser renders whatever
 * `listProducts` returns and only ever sends product *ids* + quantities back —
 * prices are computed here (see `priceItems`) so a client can never dictate the
 * amount that gets charged. This is the single source of truth for both the
 * storefront UI and every payment action.
 */

export type Product = {
	id: string;
	name: string;
	origin: string;
	category: "coffee" | "gear";
	priceCop: number;
	weight: string;
	badge?: "Bestseller" | "New" | "Limited";
	blurb: string;
	description: string;
	tasting: string[];
	specs: { label: string; value: string }[];
	/** Two-stop gradient [from, to] used to art-direct the product visual. */
	gradient: [string, string];
	/** lucide-react icon name, mapped to a component on the client. */
	icon: string;
};

export const PRODUCTS: Product[] = [
	{
		id: "huila-reserve",
		name: "Huila Reserve",
		origin: "Huila, Colombia",
		category: "coffee",
		priceCop: 48000,
		weight: "340 g whole bean",
		badge: "Bestseller",
		blurb: "Our everyday classic — round, sweet and endlessly drinkable.",
		description:
			"Grown between 1,500 and 1,800 masl in the south of Huila, washed and sun-dried on raised beds. A dependable, comforting cup with the kind of balance that disappears from the shelf first.",
		tasting: ["Red apple", "Caramel", "Cocoa"],
		specs: [
			{ label: "Roast", value: "Medium" },
			{ label: "Process", value: "Washed" },
			{ label: "Altitude", value: "1,500–1,800 masl" },
		],
		gradient: ["#7c3f1d", "#3d2817"],
		icon: "Coffee",
	},
	{
		id: "narino-sunrise",
		name: "Nariño Sunrise",
		origin: "Nariño, Colombia",
		category: "coffee",
		priceCop: 52000,
		weight: "340 g whole bean",
		badge: "New",
		blurb: "Bright, floral and delicate — a light roast for clear mornings.",
		description:
			"High-altitude Nariño beans roasted light to keep every aromatic note intact. Best brewed as a pour-over to show off its tea-like clarity and lingering sweetness.",
		tasting: ["Jasmine", "Mandarin", "Honey"],
		specs: [
			{ label: "Roast", value: "Light" },
			{ label: "Process", value: "Washed" },
			{ label: "Altitude", value: "2,000–2,300 masl" },
		],
		gradient: ["#c2843b", "#8a4b1e"],
		icon: "Sunrise",
	},
	{
		id: "sierra-decaf",
		name: "Sierra Nevada Decaf",
		origin: "Sierra Nevada, Colombia",
		category: "coffee",
		priceCop: 46000,
		weight: "340 g whole bean",
		blurb: "Sugarcane-decaffeinated, with none of the compromise.",
		description:
			"Naturally decaffeinated using sugarcane ethanol grown nearby, preserving body and sweetness. The cup you reach for after dinner without a second thought.",
		tasting: ["Brown sugar", "Almond", "Plum"],
		specs: [
			{ label: "Roast", value: "Medium" },
			{ label: "Process", value: "Sugarcane decaf" },
			{ label: "Caffeine", value: "99.9% free" },
		],
		gradient: ["#4d5d53", "#26302a"],
		icon: "Leaf",
	},
	{
		id: "tolima-honey",
		name: "Tolima Honey",
		origin: "Tolima, Colombia",
		category: "coffee",
		priceCop: 58000,
		weight: "340 g whole bean",
		badge: "Limited",
		blurb: "A honey-process micro-lot — syrupy, fruity and rare.",
		description:
			"Mucilage left on the bean during drying gives this Tolima micro-lot a dense, syrupy sweetness. A small harvest, roasted in tiny batches while it lasts.",
		tasting: ["Panela", "Apricot", "Florals"],
		specs: [
			{ label: "Roast", value: "Medium-light" },
			{ label: "Process", value: "Honey" },
			{ label: "Altitude", value: "1,700–1,900 masl" },
		],
		gradient: ["#d08a3e", "#9a3412"],
		icon: "Flower2",
	},
	{
		id: "maestro-blend",
		name: "Espresso Maestro",
		origin: "Signature blend",
		category: "coffee",
		priceCop: 95000,
		weight: "1 kg whole bean",
		badge: "Bestseller",
		blurb: "A dark, chocolatey blend built for espresso and milk drinks.",
		description:
			"Our house espresso: a kilo of dark-roasted Colombian beans tuned for thick crema and a long, sweet finish. The workhorse behind every café we supply.",
		tasting: ["Dark chocolate", "Hazelnut", "Molasses"],
		specs: [
			{ label: "Roast", value: "Dark" },
			{ label: "Best for", value: "Espresso · Moka" },
			{ label: "Grind", value: "Whole bean" },
		],
		gradient: ["#4a2f1c", "#1c120b"],
		icon: "CupSoda",
	},
	{
		id: "v60-dripper",
		name: "V60 Ceramic Dripper",
		origin: "Brew gear",
		category: "gear",
		priceCop: 89000,
		weight: "Size 02 · Ceramic",
		blurb: "The pour-over standard — even extraction, beautiful on the bench.",
		description:
			"A heat-retaining ceramic cone with a spiral rib pattern and a single large hole for clean, controllable pour-overs. Pairs perfectly with Nariño Sunrise.",
		tasting: [],
		specs: [
			{ label: "Material", value: "Glazed ceramic" },
			{ label: "Capacity", value: "1–4 cups" },
			{ label: "Filters", value: "Size 02 cone" },
		],
		gradient: ["#8a8f98", "#4b4f57"],
		icon: "FilterIcon",
	},
	{
		id: "gooseneck-kettle",
		name: "Gooseneck Kettle",
		origin: "Brew gear",
		category: "gear",
		priceCop: 175000,
		weight: "0.9 L · Variable temp",
		blurb: "Precise pours and exact temperatures, down to the degree.",
		description:
			"A counter-balanced gooseneck spout and 1°C temperature control give you total command of flow rate and heat — the difference between good and great pour-over.",
		tasting: [],
		specs: [
			{ label: "Capacity", value: "0.9 L" },
			{ label: "Range", value: "40–100 °C" },
			{ label: "Hold", value: "60 min" },
		],
		gradient: ["#3f4753", "#1e242c"],
		icon: "Thermometer",
	},
	{
		id: "cold-brew-carafe",
		name: "Cold Brew Carafe",
		origin: "Brew gear",
		category: "gear",
		priceCop: 120000,
		weight: "1 L · Borosilicate",
		blurb: "Steep overnight, pour all week — smooth cold brew at home.",
		description:
			"A borosilicate glass carafe with a fine stainless mesh core. Load with coarse grounds, steep 12–18 hours, and keep a week of concentrate in the fridge.",
		tasting: [],
		specs: [
			{ label: "Capacity", value: "1 L" },
			{ label: "Material", value: "Borosilicate glass" },
			{ label: "Filter", value: "Stainless mesh" },
		],
		gradient: ["#6b7280", "#374151"],
		icon: "Milk",
	},
];

const PRODUCTS_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export type CartLine = { productId: string; quantity: number };

export type PricedCart = {
	value: number;
	tax: number;
	taxBase: number;
	currency: string;
	itemCount: number;
	description: string;
	lines: { product: Product; quantity: number; lineTotal: number }[];
};

/**
 * Compute a trusted total from `{ productId, quantity }` pairs. Throws on an
 * empty cart, an unknown product, or an out-of-range quantity — the caller
 * (a payment action) should never have to trust client-supplied money.
 */
export function priceItems(items: CartLine[]): PricedCart {
	if (!items.length) throw new ConvexError({ message: "Your cart is empty." });

	const lines = items.map((item) => {
		const product = PRODUCTS_BY_ID.get(item.productId);
		if (!product) {
			throw new ConvexError({ message: `Unknown product: ${item.productId}` });
		}
		const quantity = Math.floor(item.quantity);
		if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
			throw new ConvexError({ message: `Invalid quantity for ${product.name}.` });
		}
		return { product, quantity, lineTotal: product.priceCop * quantity };
	});

	const value = lines.reduce((sum, line) => sum + line.lineTotal, 0);
	const summary = lines
		.map((line) => `${line.quantity}x ${line.product.name}`)
		.join(", ");

	return {
		value,
		tax: 0,
		taxBase: value,
		currency: "COP",
		itemCount: lines.reduce((count, line) => count + line.quantity, 0),
		description: summary.length > 240 ? `${summary.slice(0, 237)}...` : summary,
		lines,
	};
}

export const cartLineValidator = v.object({
	productId: v.string(),
	quantity: v.number(),
});

export const listProducts = query({
	args: {},
	returns: v.any(),
	handler: async () => PRODUCTS,
});

export const getProduct = query({
	args: { id: v.string() },
	returns: v.any(),
	handler: async (_ctx, args) => PRODUCTS_BY_ID.get(args.id) ?? null,
});
