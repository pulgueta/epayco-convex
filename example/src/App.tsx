import "./App.css";
import { useAuthActions } from "@convex-dev/auth/react";
import {
	Authenticated,
	Unauthenticated,
	AuthLoading,
	useQuery,
	useAction,
} from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "../convex/_generated/api";

// ─── Styles ───────────────────────────────────────────────

const card: React.CSSProperties = {
	padding: "1.25rem",
	border: "1px solid #333",
	borderRadius: "8px",
	marginBottom: "1rem",
};
const input: React.CSSProperties = {
	width: "100%",
	padding: "0.5rem",
	marginBottom: "0.5rem",
	borderRadius: "4px",
	border: "1px solid #555",
	background: "#1a1a1a",
	color: "#fff",
	boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
	padding: "0.5rem 1.25rem",
	borderRadius: "4px",
	border: "none",
	background: "#646cff",
	color: "#fff",
	cursor: "pointer",
	fontWeight: 600,
};
const btnOutline: React.CSSProperties = {
	padding: "0.4rem 1rem",
	borderRadius: "4px",
	border: "1px solid #555",
	background: "transparent",
	color: "#fff",
	cursor: "pointer",
};
const row: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "1fr 1fr",
	gap: "0.5rem",
};
const label: React.CSSProperties = {
	fontSize: "0.8rem",
	color: "#999",
	marginBottom: "0.25rem",
	display: "block",
};
const badge = (color: string): React.CSSProperties => ({
	display: "inline-block",
	padding: "0.15rem 0.5rem",
	borderRadius: "9999px",
	fontSize: "0.75rem",
	fontWeight: 600,
	background: `${color}22`,
	color,
});

function errMsg(err: unknown): string {
	if (err && typeof err === "object" && "data" in err) {
		const data = (err as { data?: unknown }).data;
		if (data && typeof data === "object" && "message" in data) {
			return String((data as { message?: unknown }).message);
		}
	}
	return err instanceof Error ? err.message : "Something went wrong";
}

// ─── Auth ─────────────────────────────────────────────────

function SignInForm() {
	const { signIn } = useAuthActions();
	const [flow, setFlow] = useState<"signIn" | "signUp">("signUp");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		formData.set("flow", flow);
		setError(null);
		setLoading(true);
		void signIn("password", formData)
			.catch((err) => setError(errMsg(err)))
			.finally(() => setLoading(false));
	};

	return (
		<div style={{ maxWidth: "360px", margin: "2rem auto" }}>
			<h2>{flow === "signIn" ? "Sign In" : "Sign Up"}</h2>
			<form onSubmit={handleSubmit}>
				<input name="email" type="email" placeholder="Email" required style={input} />
				<input name="password" type="password" placeholder="Password" required style={input} />
				<button type="submit" disabled={loading} style={{ ...btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}>
					{loading ? "..." : flow === "signIn" ? "Sign In" : "Sign Up"}
				</button>
			</form>
			{error && <p style={{ color: "#f55", marginTop: "0.5rem", fontSize: "0.9rem" }}>{error}</p>}
			<p style={{ marginTop: "1rem", fontSize: "0.9rem", textAlign: "center" }}>
				{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
				<button
					type="button"
					onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError(null); }}
					style={{ background: "none", border: "none", color: "#646cff", cursor: "pointer", textDecoration: "underline", padding: 0 }}
				>
					{flow === "signIn" ? "Sign Up" : "Sign In"}
				</button>
			</p>
		</div>
	);
}

// ─── Tokenize Card ────────────────────────────────────────

function TokenizeCard() {
	const tokenize = useAction(api.example.tokenizeCard);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setOk(false);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			await tokenize({
				cardNumber: (fd.get("cardNumber") as string).replace(/\s+/g, ""),
				expYear: fd.get("expYear") as string,
				expMonth: fd.get("expMonth") as string,
				cvc: fd.get("cvc") as string,
			});
			setOk(true);
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={card}>
			<h3 style={{ marginTop: 0 }}>1. Tokenize Card</h3>
			<p style={{ fontSize: "0.85rem", color: "#888" }}>
				Securely tokenize a credit card. Sandbox test card: 4575 6234 1234 1234.
			</p>
			<form onSubmit={handleSubmit}>
				<input name="cardNumber" placeholder="Card number" defaultValue="4575623412341234" required style={input} />
				<div style={row}>
					<input name="expMonth" placeholder="MM" defaultValue="12" required style={input} />
					<input name="expYear" placeholder="YYYY" defaultValue="2030" required style={input} />
				</div>
				<input name="cvc" placeholder="CVC" defaultValue="123" required style={input} />
				<button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
					{loading ? "Tokenizing..." : "Tokenize"}
				</button>
			</form>
			{ok && <p style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem" }}>Card tokenized.</p>}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Create Customer ──────────────────────────────────────

function CreateCustomer({ tokenId }: { tokenId: string | null }) {
	const createCustomer = useAction(api.example.createCustomer);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!tokenId) return;
		setError(null);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			await createCustomer({
				tokenCard: tokenId,
				name: fd.get("name") as string,
				lastName: fd.get("lastName") as string,
				email: fd.get("email") as string,
				phone: (fd.get("phone") as string) || undefined,
				docType: (fd.get("docType") as string) || undefined,
				docNumber: (fd.get("docNumber") as string) || undefined,
			});
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ ...card, opacity: tokenId ? 1 : 0.5 }}>
			<h3 style={{ marginTop: 0 }}>2. Create Customer</h3>
			<p style={{ fontSize: "0.85rem", color: "#888" }}>
				Link the tokenized card to a customer profile.
				{tokenId && <span style={{ color: "#4ade80" }}> Token ready.</span>}
			</p>
			<form onSubmit={handleSubmit}>
				<div style={row}>
					<input name="name" placeholder="Name" defaultValue="Test" required style={input} />
					<input name="lastName" placeholder="Last name" defaultValue="User" required style={input} />
				</div>
				<div style={row}>
					<input name="email" type="email" placeholder="Email" defaultValue="test@example.com" required style={input} />
					<input name="phone" placeholder="Phone" defaultValue="3001234567" style={input} />
				</div>
				<div style={row}>
					<input name="docType" placeholder="Doc type" defaultValue="CC" style={input} />
					<input name="docNumber" placeholder="Doc number" defaultValue="1234567890" style={input} />
				</div>
				<button type="submit" disabled={!tokenId || loading} style={{ ...btnPrimary, opacity: !tokenId || loading ? 0.5 : 1 }}>
					{loading ? "Creating..." : "Create Customer"}
				</button>
			</form>
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Charge Credit Card ───────────────────────────────────

function ChargeCard({ tokenId, customerId }: { tokenId: string | null; customerId: string | null }) {
	const charge = useAction(api.example.chargeCreditCard);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const ready = !!(tokenId && customerId);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!ready) return;
		setError(null);
		setSuccess(null);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			const result = await charge({
				tokenCard: tokenId!,
				customerId: customerId!,
				docType: fd.get("docType") as string,
				docNumber: fd.get("docNumber") as string,
				name: fd.get("name") as string,
				lastName: fd.get("lastName") as string,
				email: fd.get("email") as string,
				bill: fd.get("bill") as string,
				description: fd.get("description") as string,
				value: Number(fd.get("value")),
				tax: Number(fd.get("tax")),
				taxBase: Number(fd.get("taxBase")),
			});
			const ref = result?.data?.ref_payco ?? result?.data?.refPayco;
			setSuccess(`Charge submitted${ref ? ` — ref ${ref}` : ""}.`);
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ ...card, opacity: ready ? 1 : 0.5 }}>
			<h3 style={{ marginTop: 0 }}>3. Charge Credit Card</h3>
			<p style={{ fontSize: "0.85rem", color: "#888" }}>
				Charge the customer's card.
				{ready && <span style={{ color: "#4ade80" }}> Customer ready.</span>}
			</p>
			<form onSubmit={handleSubmit}>
				<div style={row}>
					<input name="name" placeholder="Name" defaultValue="Test" required style={input} />
					<input name="lastName" placeholder="Last name" defaultValue="User" required style={input} />
				</div>
				<div style={row}>
					<input name="email" type="email" placeholder="Email" defaultValue="test@example.com" required style={input} />
					<input name="bill" placeholder="Bill / Invoice #" defaultValue="INV-001" required style={input} />
				</div>
				<div style={row}>
					<input name="docType" placeholder="Doc type" defaultValue="CC" required style={input} />
					<input name="docNumber" placeholder="Doc number" defaultValue="1234567890" required style={input} />
				</div>
				<input name="description" placeholder="Description" defaultValue="Test payment" required style={input} />
				<div style={{ ...row, gridTemplateColumns: "1fr 1fr 1fr" }}>
					<div>
						<span style={label}>Amount (COP)</span>
						<input name="value" type="number" defaultValue="50000" required style={input} />
					</div>
					<div>
						<span style={label}>Tax</span>
						<input name="tax" type="number" defaultValue="0" required style={input} />
					</div>
					<div>
						<span style={label}>Tax base</span>
						<input name="taxBase" type="number" defaultValue="50000" required style={input} />
					</div>
				</div>
				<button type="submit" disabled={!ready || loading} style={{ ...btnPrimary, opacity: !ready || loading ? 0.5 : 1 }}>
					{loading ? "Charging..." : "Pay Now"}
				</button>
			</form>
			{success && <p style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem" }}>{success}</p>}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Cash Payment ─────────────────────────────────────────

function CashPayment() {
	const pay = useAction(api.example.createCashPayment);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			const result = await pay({
				provider: fd.get("provider") as "efecty" | "baloto" | "gana" | "redservi" | "puntored" | "sured",
				name: fd.get("name") as string,
				lastName: fd.get("lastName") as string,
				email: fd.get("email") as string,
				phone: fd.get("phone") as string,
				docType: fd.get("docType") as string,
				docNumber: fd.get("docNumber") as string,
				bill: fd.get("bill") as string,
				description: fd.get("description") as string,
				value: Number(fd.get("value")),
				tax: 0,
				taxBase: Number(fd.get("value")),
			});
			const ref = result?.data?.ref_payco ?? result?.data?.refPayco;
			setSuccess(`Cash voucher created${ref ? ` — ref ${ref}` : ""}.`);
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={card}>
			<h3 style={{ marginTop: 0 }}>Cash Payment (Efecty, Baloto...)</h3>
			<form onSubmit={handleSubmit}>
				<select name="provider" required style={{ ...input, appearance: "auto" }}>
					<option value="efecty">Efecty</option>
					<option value="baloto">Baloto</option>
					<option value="gana">Gana</option>
					<option value="redservi">Redservi</option>
					<option value="puntored">Puntored</option>
					<option value="sured">Sured</option>
				</select>
				<div style={row}>
					<input name="name" placeholder="Name" defaultValue="Test" required style={input} />
					<input name="lastName" placeholder="Last name" defaultValue="User" required style={input} />
				</div>
				<div style={row}>
					<input name="email" type="email" placeholder="Email" defaultValue="test@example.com" required style={input} />
					<input name="phone" placeholder="Phone" defaultValue="3001234567" required style={input} />
				</div>
				<div style={row}>
					<input name="docType" placeholder="Doc type" defaultValue="CC" required style={input} />
					<input name="docNumber" placeholder="Doc number" defaultValue="1234567890" required style={input} />
				</div>
				<div style={row}>
					<input name="bill" placeholder="Bill #" defaultValue="CASH-001" required style={input} />
					<input name="description" placeholder="Description" defaultValue="Cash payment test" required style={input} />
				</div>
				<div>
					<span style={label}>Amount (COP)</span>
					<input name="value" type="number" defaultValue="30000" required style={input} />
				</div>
				<button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
					{loading ? "Processing..." : "Generate Cash Voucher"}
				</button>
			</form>
			{success && <p style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem" }}>{success}</p>}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── PSE ──────────────────────────────────────────────────

function PsePayment() {
	const refreshBanks = useAction(api.example.refreshBanks);
	const createPse = useAction(api.example.createPse);
	const banks = useQuery(api.example.listBanks) ?? [];
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleRefresh = async () => {
		setRefreshing(true);
		setError(null);
		try {
			await refreshBanks({});
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setRefreshing(false);
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			const result = await createPse({
				bank: fd.get("bank") as string,
				typePerson: "0",
				name: fd.get("name") as string,
				lastName: fd.get("lastName") as string,
				email: fd.get("email") as string,
				cellPhone: fd.get("cellPhone") as string,
				docType: fd.get("docType") as string,
				docNumber: fd.get("docNumber") as string,
				bill: fd.get("bill") as string,
				description: fd.get("description") as string,
				value: Number(fd.get("value")),
				tax: 0,
				taxBase: Number(fd.get("value")),
			});
			const url = result?.data?.urlbanco ?? result?.data?.url_banco;
			setSuccess(url ? `PSE created. Redirect URL: ${url}` : "PSE transaction created.");
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={card}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<h3 style={{ marginTop: 0 }}>PSE (Bank transfer)</h3>
				<button type="button" onClick={handleRefresh} disabled={refreshing} style={btnOutline}>
					{refreshing ? "..." : `Refresh banks (${banks.length})`}
				</button>
			</div>
			<form onSubmit={handleSubmit}>
				<select name="bank" required style={{ ...input, appearance: "auto" }}>
					<option value="">Select a bank…</option>
					{banks.map((b: { _id: string; bankCode: string; bankName: string }) => (
						<option key={b._id} value={b.bankCode}>{b.bankName}</option>
					))}
				</select>
				<div style={row}>
					<input name="name" placeholder="Name" defaultValue="Test" required style={input} />
					<input name="lastName" placeholder="Last name" defaultValue="User" required style={input} />
				</div>
				<div style={row}>
					<input name="email" type="email" placeholder="Email" defaultValue="test@example.com" required style={input} />
					<input name="cellPhone" placeholder="Cell phone" defaultValue="3001234567" required style={input} />
				</div>
				<div style={row}>
					<input name="docType" placeholder="Doc type" defaultValue="CC" required style={input} />
					<input name="docNumber" placeholder="Doc number" defaultValue="1234567890" required style={input} />
				</div>
				<div style={row}>
					<input name="bill" placeholder="Bill #" defaultValue="PSE-001" required style={input} />
					<input name="description" placeholder="Description" defaultValue="PSE payment test" required style={input} />
				</div>
				<div>
					<span style={label}>Amount (COP)</span>
					<input name="value" type="number" defaultValue="40000" required style={input} />
				</div>
				<button type="submit" disabled={loading || banks.length === 0} style={{ ...btnPrimary, opacity: loading || banks.length === 0 ? 0.5 : 1 }}>
					{loading ? "Processing..." : "Pay with PSE"}
				</button>
			</form>
			{banks.length === 0 && <p style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.5rem" }}>Click "Refresh banks" to load the PSE bank list first.</p>}
			{success && <p style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem", wordBreak: "break-all" }}>{success}</p>}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Subscribe ────────────────────────────────────────────

function SubscribeForm({ tokenId, customerId }: { tokenId: string | null; customerId: string | null }) {
	const createPlan = useAction(api.example.createPlan);
	const subscribe = useAction(api.example.subscribe);
	const plans = useQuery(api.example.listPlans) ?? [];
	const [loading, setLoading] = useState(false);
	const [creatingPlan, setCreatingPlan] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const ready = !!(tokenId && customerId);

	const handleCreatePlan = async () => {
		setCreatingPlan(true);
		setError(null);
		try {
			await createPlan({
				idPlan: `demo-plan-${Date.now()}`,
				name: "Demo Plan",
				description: "Demo subscription plan",
				amount: 30000,
				currency: "COP",
				interval: "month",
				intervalCount: 1,
				trialDays: 0,
			});
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setCreatingPlan(false);
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!ready) return;
		setError(null);
		setSuccess(null);
		setLoading(true);
		const fd = new FormData(e.currentTarget);
		try {
			const result = await subscribe({
				idPlan: fd.get("idPlan") as string,
				customer: customerId!,
				tokenCard: tokenId!,
				docType: fd.get("docType") as string,
				docNumber: fd.get("docNumber") as string,
			});
			setSuccess(`Subscribed${result?.data?.id ? ` — id ${result.data.id}` : ""}.`);
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ ...card, opacity: ready ? 1 : 0.5 }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<h3 style={{ marginTop: 0 }}>Subscribe to a Plan</h3>
				<button type="button" onClick={handleCreatePlan} disabled={creatingPlan} style={btnOutline}>
					{creatingPlan ? "..." : "Create demo plan"}
				</button>
			</div>
			<p style={{ fontSize: "0.85rem", color: "#888" }}>
				Requires a customer with a tokenized card.
				{ready && <span style={{ color: "#4ade80" }}> Ready.</span>}
			</p>
			<form onSubmit={handleSubmit}>
				<select name="idPlan" required style={{ ...input, appearance: "auto" }}>
					<option value="">Select a plan…</option>
					{plans.map((p: { _id: string; epaycoPlanId: string; name: string }) => (
						<option key={p._id} value={p.epaycoPlanId}>{p.name} ({p.epaycoPlanId})</option>
					))}
				</select>
				<div style={row}>
					<input name="docType" placeholder="Doc type" defaultValue="CC" required style={input} />
					<input name="docNumber" placeholder="Doc number" defaultValue="1234567890" required style={input} />
				</div>
				<button type="submit" disabled={!ready || loading} style={{ ...btnPrimary, opacity: !ready || loading ? 0.5 : 1 }}>
					{loading ? "Subscribing..." : "Subscribe"}
				</button>
			</form>
			{success && <p style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem" }}>{success}</p>}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Data Display ─────────────────────────────────────────

function CustomerInfo() {
	const customer = useQuery(api.example.getLocalCustomer);
	const tokens = useQuery(api.example.getLocalTokens);
	return (
		<div style={card}>
			<h3 style={{ marginTop: 0 }}>Customer</h3>
			{customer ? (
				<div style={{ fontSize: "0.9rem" }}>
					<p><strong>{customer.name}</strong> ({customer.email})</p>
					<p style={{ color: "#888" }}>ePayco ID: <code>{customer.epaycoCustomerId}</code></p>
				</div>
			) : (
				<p style={{ color: "#888" }}>No customer linked yet. Tokenize a card and create one above.</p>
			)}
			{tokens && tokens.length > 0 && (
				<div style={{ marginTop: "0.75rem" }}>
					<span style={label}>Saved Cards</span>
					{tokens.map((t: { _id: string; mask: string; franchise: string }) => (
						<div key={t._id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
							<code>{t.mask}</code>
							<span style={badge("#646cff")}>{t.franchise}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function TransactionList() {
	const transactions = useQuery(api.example.listTransactions);
	return (
		<div style={card}>
			<h3 style={{ marginTop: 0 }}>Transactions ({transactions?.length ?? 0})</h3>
			{transactions && transactions.length > 0 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					{transactions.map((tx: { _id: string; epaycoRef: string; paymentMethod: string; status: string; amount: number; currency: string; description: string }) => (
						<div key={tx._id} style={{ padding: "0.75rem", backgroundColor: "rgba(128,128,128,0.08)", borderRadius: "6px" }}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<div>
									<code style={{ fontSize: "0.85rem" }}>{tx.epaycoRef}</code>
									<span style={{ ...badge("#646cff"), marginLeft: "0.5rem" }}>{tx.paymentMethod}</span>
								</div>
								<span style={badge(tx.status === "approved" ? "#4ade80" : tx.status === "pending" ? "#facc15" : "#f55")}>{tx.status}</span>
							</div>
							<div style={{ marginTop: "0.35rem", fontSize: "0.85rem", color: "#ccc" }}>
								${tx.amount.toLocaleString()} {tx.currency} &mdash; {tx.description}
							</div>
						</div>
					))}
				</div>
			) : (
				<p style={{ color: "#888" }}>No transactions yet. Make a payment above.</p>
			)}
		</div>
	);
}

function SubscriptionStatus() {
	const subscription = useQuery(api.example.getActiveSubscription);
	const cancelSub = useAction(api.example.cancelSubscription);
	const [cancelling, setCancelling] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCancel = async () => {
		if (!subscription?.epaycoSubscriptionId) return;
		setCancelling(true);
		setError(null);
		try {
			await cancelSub({ epaycoSubscriptionId: subscription.epaycoSubscriptionId });
		} catch (err) {
			setError(errMsg(err));
		} finally {
			setCancelling(false);
		}
	};

	return (
		<div style={card}>
			<h3 style={{ marginTop: 0 }}>Active Subscription</h3>
			{subscription ? (
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
					<div>
						<p>Plan: <code>{subscription.epaycoPlanId}</code></p>
						<span style={badge(subscription.status === "active" ? "#4ade80" : "#facc15")}>{subscription.status}</span>
					</div>
					<button type="button" onClick={handleCancel} disabled={cancelling} style={{ ...btnOutline, borderColor: "#f55", color: "#f55" }}>
						{cancelling ? "..." : "Cancel"}
					</button>
				</div>
			) : (
				<p style={{ color: "#888" }}>No active subscription.</p>
			)}
			{error && <p style={{ color: "#f55", fontSize: "0.85rem", marginTop: "0.5rem" }}>{error}</p>}
		</div>
	);
}

// ─── Dashboard ────────────────────────────────────────────

function Dashboard() {
	const { signOut } = useAuthActions();
	const tokens = useQuery(api.example.getLocalTokens);
	const customer = useQuery(api.example.getLocalCustomer);
	const [tab, setTab] = useState<"card" | "cash" | "pse">("card");

	// Derive the active token / customer from reactive local state — robust to
	// ePayco's exact response shapes.
	const tokenId = tokens && tokens.length > 0 ? tokens[tokens.length - 1].epaycoTokenId : null;
	const customerId = customer?.epaycoCustomerId ?? null;

	return (
		<div style={{ maxWidth: "640px", margin: "0 auto" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
				<h1 style={{ margin: 0 }}>ePayco Demo</h1>
				<button type="button" onClick={() => void signOut()} style={btnOutline}>Sign Out</button>
			</div>

			<div style={{ ...card, display: "flex", gap: "1rem", flexWrap: "wrap", padding: "0.75rem 1rem", background: "#111" }}>
				<span>Token: {tokenId ? <code style={{ color: "#4ade80" }}>{tokens![tokens!.length - 1].mask}</code> : <span style={{ color: "#888" }}>none</span>}</span>
				<span>Customer: {customerId ? <code style={{ color: "#4ade80" }}>{customerId.slice(0, 14)}…</code> : <span style={{ color: "#888" }}>none</span>}</span>
			</div>

			<h2>Payment Flow</h2>
			<TokenizeCard />
			<CreateCustomer tokenId={tokenId} />

			<div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
				{(["card", "cash", "pse"] as const).map((t) => (
					<button key={t} type="button" onClick={() => setTab(t)} style={{ ...btnOutline, ...(tab === t ? { background: "#646cff", borderColor: "#646cff" } : {}) }}>
						{t === "card" ? "Credit Card" : t === "cash" ? "Cash" : "PSE"}
					</button>
				))}
			</div>

			{tab === "card" && <ChargeCard tokenId={tokenId} customerId={customerId} />}
			{tab === "cash" && <CashPayment />}
			{tab === "pse" && <PsePayment />}

			<h2>Subscriptions</h2>
			<SubscribeForm tokenId={tokenId} customerId={customerId} />

			<h2>Your Data</h2>
			<CustomerInfo />
			<TransactionList />
			<SubscriptionStatus />

			<div style={{ ...card, background: "rgba(100,108,255,0.05)", borderColor: "#646cff33" }}>
				<h3 style={{ marginTop: 0 }}>Webhook Endpoint</h3>
				<p style={{ fontSize: "0.85rem", color: "#aaa" }}>Configure ePayco confirmation URL:</p>
				<code style={{ fontSize: "0.85rem" }}>{"{CONVEX_SITE_URL}"}/epayco/confirmation</code>
			</div>
		</div>
	);
}

function App() {
	return (
		<>
			<AuthLoading>
				<p style={{ textAlign: "center", marginTop: "3rem", color: "#888" }}>Loading...</p>
			</AuthLoading>
			<Unauthenticated>
				<div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
					<h1>ePayco Convex Demo</h1>
					<p style={{ color: "#888" }}>Sign in to test the ePayco payment component</p>
					<SignInForm />
				</div>
			</Unauthenticated>
			<Authenticated>
				<Dashboard />
			</Authenticated>
		</>
	);
}

export default App;
