"use client";

import { useQuery, useAction } from "convex/react";
import { useState, useCallback } from "react";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

type AnyQueryRef = FunctionReference<"query", "public", any, any>;
type AnyActionRef = FunctionReference<"action", "public", any, any>;

export function useTransactions<Ref extends AnyQueryRef>(
  ref: Ref,
  args: FunctionArgs<Ref>,
) {
  return useQuery(ref, args);
}

export function useTransaction<Ref extends AnyQueryRef>(
  ref: Ref,
  args: FunctionArgs<Ref>,
) {
  return useQuery(ref, args);
}

export function useSubscriptions<Ref extends AnyQueryRef>(
  ref: Ref,
  args: FunctionArgs<Ref>,
) {
  return useQuery(ref, args);
}

export function useActiveSubscription<Ref extends AnyQueryRef>(
  ref: Ref,
  args: FunctionArgs<Ref>,
) {
  return useQuery(ref, args);
}

export function useCustomer<Ref extends AnyQueryRef>(
  ref: Ref,
  args: FunctionArgs<Ref>,
) {
  return useQuery(ref, args);
}

export function usePayment<Ref extends AnyActionRef>(ref: Ref) {
  const runAction = useAction(ref);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<FunctionReturnType<Ref> | null>(null);

  const execute = useCallback(
    async (args: FunctionArgs<Ref>) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await runAction(args);
        setResult(res);
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [runAction],
  );

  return { execute, isLoading, error, result };
}
