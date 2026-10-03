"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchIngredients, type IngredientSummary } from "./api";

let cache: IngredientSummary[] | null = null;

export function useIngredients() {
  const [ingredients, setIngredients] = useState<IngredientSummary[]>(cache ?? []);
  const [loading, setLoading] = useState<boolean>(cache === null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (cache) {
      setIngredients(cache);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetchIngredients()
      .then((data) => {
        cache = data;
        if (active) {
          setIngredients(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tick]);

  const retry = useCallback(() => {
    cache = null;
    setTick((t) => t + 1);
  }, []);

  return { ingredients, loading, error, retry };
}