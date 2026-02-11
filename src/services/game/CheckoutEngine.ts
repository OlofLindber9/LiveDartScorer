import { CHECKOUT_TABLE, IMPOSSIBLE_FINISHES } from '../../constants/checkouts';

export interface CheckoutSuggestion {
  remaining: number;
  route: string[];
  isCheckout: boolean;
  dartsNeeded: number;
}

export function getCheckoutSuggestion(remaining: number): CheckoutSuggestion | null {
  if (remaining > 170 || remaining < 2) return null;

  if ((IMPOSSIBLE_FINISHES as readonly number[]).includes(remaining)) {
    return { remaining, route: [], isCheckout: false, dartsNeeded: 0 };
  }

  const route = CHECKOUT_TABLE[remaining];
  if (!route) return null;

  return {
    remaining,
    route,
    isCheckout: true,
    dartsNeeded: route.length,
  };
}
