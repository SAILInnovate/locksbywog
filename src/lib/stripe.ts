/**
 * Stripe client bootstrap.
 *
 * `loadStripe` is memoised, so the Stripe.js script is fetched a single time
 * per page load no matter how often the payment step is entered.
 *
 * The publishable key is optional. When it is absent the booking flow keeps
 * using Stripe's hosted checkout page, so the site stays fully functional
 * before the key is configured in the environment.
 */

import type { Stripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

/** True when embedded checkout can be attempted at all. */
export const canUseEmbeddedCheckout = Boolean(publishableKey);

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;

  if (!stripePromise) {
    // Loaded lazily so Stripe.js is not part of the initial bundle for the
    // majority of visitors who never open the booking flow.
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(publishableKey)
    );
  }

  return stripePromise;
}

/**
 * Starts loading Stripe.js early, without waiting for it. Called when the
 * visitor reaches the payment step so the library is ready by the time they
 * actually commit.
 */
export function prefetchStripe(): void {
  void getStripe();
}
