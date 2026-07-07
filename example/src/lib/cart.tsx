import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

/**
 * Client-side cart. Carts aren't the payment component's concern, so they live
 * entirely in the browser (versioned localStorage) and only ever hold
 * `{ productId, quantity }`. Checkout sends those ids to the server, which
 * recomputes the trusted price. State lives in the provider so the header
 * badge, cart sheet and checkout all read one source.
 */

export type CartItem = { productId: string; quantity: number };

type CartContextValue = {
	items: CartItem[];
	count: number;
	add: (productId: string, quantity?: number) => void;
	setQuantity: (productId: string, quantity: number) => void;
	remove: (productId: string) => void;
	clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "tostado.cart.v1";
const MAX_QTY = 99;

function readCart(): CartItem[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(entry): entry is CartItem =>
					!!entry &&
					typeof entry === "object" &&
					typeof (entry as CartItem).productId === "string" &&
					typeof (entry as CartItem).quantity === "number",
			)
			.map((entry) => ({
				productId: entry.productId,
				quantity: Math.min(MAX_QTY, Math.max(1, Math.floor(entry.quantity))),
			}));
	} catch {
		return [];
	}
}

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>(readCart);

	useEffect(() => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		} catch {
			// Storage may be unavailable (private mode); the cart still works in memory.
		}
	}, [items]);

	const add = useCallback((productId: string, quantity = 1) => {
		setItems((prev) => {
			const existing = prev.find((item) => item.productId === productId);
			if (existing) {
				return prev.map((item) =>
					item.productId === productId
						? {
								...item,
								quantity: Math.min(MAX_QTY, item.quantity + quantity),
							}
						: item,
				);
			}
			return [...prev, { productId, quantity: Math.min(MAX_QTY, quantity) }];
		});
	}, []);

	const setQuantity = useCallback((productId: string, quantity: number) => {
		setItems((prev) =>
			quantity <= 0
				? prev.filter((item) => item.productId !== productId)
				: prev.map((item) =>
						item.productId === productId
							? { ...item, quantity: Math.min(MAX_QTY, quantity) }
							: item,
					),
		);
	}, []);

	const remove = useCallback((productId: string) => {
		setItems((prev) => prev.filter((item) => item.productId !== productId));
	}, []);

	const clear = useCallback(() => setItems([]), []);

	const count = useMemo(
		() => items.reduce((sum, item) => sum + item.quantity, 0),
		[items],
	);

	const value = useMemo<CartContextValue>(
		() => ({ items, count, add, setQuantity, remove, clear }),
		[items, count, add, setQuantity, remove, clear],
	);

	return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
	const ctx = use(CartContext);
	if (!ctx) throw new Error("useCart must be used within <CartProvider>.");
	return ctx;
}
