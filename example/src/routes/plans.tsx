import { usePayment } from "@pulgueta/epayco-convex/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import { Check, Coffee, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@cvx/_generated/api";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Price } from "@/components/money";
import {
  PaymentPanel,
  type PaymentPayload,
} from "@/components/payment/payment-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { errorMessage } from "@/lib/errors";
import { formatCOP } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanTier, Subscription } from "@/lib/types";

export const Route = createFileRoute("/plans")({ component: PlansRoute });

function PlansRoute() {
  const tiers = useQuery(api.subscriptions.listPlanTiers) as
    | PlanTier[]
    | undefined;
  const [selected, setSelected] = useState<PlanTier | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Coffee className="size-3.5" />
          Coffee Club
        </span>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Fresh beans, every month.
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          Pick a tier and we'll roast and ship on schedule. Recurring billing
          runs on ePayco plans — pause or cancel anytime from your account.
        </p>
      </div>

      <Authenticated>
        <ActiveSubscriptionBanner tiers={tiers} />
      </Authenticated>

      <AuthLoading>
        <PlanGrid tiers={tiers} onSelect={setSelected} />
      </AuthLoading>
      <Unauthenticated>
        <PlanGrid tiers={tiers} onSelect={setSelected} />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedPlanGrid tiers={tiers} onSelect={setSelected} />
      </Authenticated>

      <SubscribeSheet
        plan={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function PlanGrid({
  tiers,
  onSelect,
  active,
}: {
  tiers: PlanTier[] | undefined;
  onSelect: (tier: PlanTier) => void;
  active?: Subscription | null;
}) {
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-3">
      {tiers
        ? tiers.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              disabled={!!active}
              buttonLabel={active ? "Subscription active" : undefined}
              onSubscribe={() => onSelect(tier)}
            />
          ))
        : Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-96 w-full rounded-2xl" />
          ))}
    </div>
  );
}

function AuthenticatedPlanGrid({
  tiers,
  onSelect,
}: {
  tiers: PlanTier[] | undefined;
  onSelect: (tier: PlanTier) => void;
}) {
  const active = useQuery(api.account.getActiveSubscription) as
    | Subscription
    | null
    | undefined;
  return <PlanGrid tiers={tiers} active={active} onSelect={onSelect} />;
}

function ActiveSubscriptionBanner({
  tiers,
}: {
  tiers: PlanTier[] | undefined;
}) {
  const active = useQuery(api.account.getActiveSubscription) as
    | Subscription
    | null
    | undefined;
  if (!active) return null;

  const tier = tiers?.find((t) => t.id === active.epaycoPlanId);

  return (
    <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-4" />
        </span>
        <p className="text-sm">
          You're subscribed to the{" "}
          <strong>{tier?.name ?? "Coffee Club"}</strong> plan.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/account">Manage</Link>
      </Button>
    </div>
  );
}

function PlanCard({
  tier,
  onSubscribe,
  disabled = false,
  buttonLabel,
}: {
  tier: PlanTier;
  onSubscribe: () => void;
  disabled?: boolean;
  buttonLabel?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-card p-6 ring-1 ring-border",
        tier.featured && "ring-2 ring-primary",
      )}
    >
      {tier.featured ? (
        <Badge className="absolute -top-2.5 left-6 bg-ember text-ember-foreground">
          <Sparkles className="size-3" />
          Most popular
        </Badge>
      ) : null}

      <h2 className="font-display text-2xl font-semibold">{tier.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <Price value={tier.amountCop} className="text-3xl font-semibold" />
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>
      {tier.trialDays > 0 ? (
        <p className="mt-1 text-xs font-medium text-primary">
          {tier.trialDays}-day free trial
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Billed monthly</p>
      )}

      <ul className="mt-6 grid flex-1 gap-3 text-sm">
        {tier.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {perk}
          </li>
        ))}
      </ul>

      <Button
        className="mt-7 w-full"
        size="lg"
        variant={tier.featured ? "default" : "outline"}
        onClick={onSubscribe}
        disabled={disabled}
      >
        {buttonLabel ?? `Choose ${tier.name}`}
      </Button>
    </div>
  );
}

function SubscribeSheet({
  plan,
  onOpenChange,
}: {
  plan: PlanTier | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { execute, isLoading, error } = usePayment(api.subscriptions.subscribe);

  async function handlePay(payload: PaymentPayload) {
    if (!plan) return;
    try {
      await execute({
        planId: plan.id,
        billing: payload.billing,
        cardToken: payload.cardToken,
        savedTokenId: payload.savedTokenId,
      });
      toast.success("Welcome to the Coffee Club!", {
        description: `Your ${plan.name} subscription is active.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <Sheet open={!!plan} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">
            Join {plan?.name}
          </SheetTitle>
          <SheetDescription>
            {plan ? (
              <>
                {formatCOP(plan.amountCop)}/month
                {plan.trialDays > 0
                  ? ` · ${plan.trialDays}-day free trial`
                  : ""}
                . Cancel anytime.
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <AuthLoading>
            <Skeleton className="h-72 w-full" />
          </AuthLoading>
          <Unauthenticated>
            <p className="mb-4 text-sm text-muted-foreground">
              Sign in to start your subscription.
            </p>
            <SignInForm />
          </Unauthenticated>
          <Authenticated>
            <PaymentPanel
              submitLabel={
                plan
                  ? `Subscribe — ${formatCOP(plan.amountCop)}/mo`
                  : "Subscribe"
              }
              pending={isLoading}
              error={error ? errorMessage(error) : null}
              onPay={handlePay}
            />
          </Authenticated>
        </div>
      </SheetContent>
    </Sheet>
  );
}
