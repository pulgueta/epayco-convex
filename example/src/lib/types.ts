/**
 * Frontend-facing shapes. The Convex queries return `v.any()` (they pass through
 * ePayco data), so we describe the fields the UI actually reads here rather than
 * pulling Convex's server types across the app/convex tsconfig boundary.
 */

export type ProductCategory = "coffee" | "gear";

export type Product = {
  id: string;
  name: string;
  origin: string;
  category: ProductCategory;
  priceCop: number;
  weight: string;
  badge?: "Bestseller" | "New" | "Limited";
  blurb: string;
  description: string;
  tasting: string[];
  specs: { label: string; value: string }[];
  gradient: [string, string];
  icon: string;
};

export type PlanTier = {
  id: string;
  name: string;
  tagline: string;
  amountCop: number;
  interval: "month";
  intervalCount: number;
  trialDays: number;
  bags: number;
  perks: string[];
  featured: boolean;
};

export type SplitPartner = {
  id: string;
  name: string;
  role: string;
  percentage: number;
};

export type SavedCard = {
  _id: string;
  mask: string;
  franchise: string;
};

export type SplitReceiver = {
  id: string;
  total: number;
  iva: number;
  base_iva: number;
  fee?: number;
};

export type Transaction = {
  _id: string;
  _creationTime: number;
  epaycoRef: string;
  paymentMethod: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  franchise?: string;
  responseMessage?: string;
  splitPayment?: boolean;
  splitReceivers?: SplitReceiver[];
};

export type Subscription = {
  _id: string;
  _creationTime: number;
  epaycoSubscriptionId: string;
  epaycoPlanId: string;
  status: string;
};

export type Me = {
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  documentType: string | null;
  documentNumber: string | null;
} | null;
