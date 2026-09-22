/**
 * Payment session plumbing.
 *
 * The browser asks a Supabase Edge Function to create a Stripe Checkout
 * Session. That function can answer in two shapes:
 *
 *   { client_secret }  - embedded mode, rendered inside our own modal
 *   { url }            - hosted mode, Stripe's own page
 *
 * This module normalises both so the UI never has to care which one the
 * deployed function supports. That is what makes the embedded rollout safe:
 * the frontend can ship before the edge function is redeployed and it simply
 * keeps using the hosted page until it is.
 */

import { supabase } from '@/lib/supabase';
import { canUseEmbeddedCheckout } from '@/lib/stripe';

export interface CheckoutRequest {
  bookingId: string;
  name: string;
  email: string;
  serviceName: string;
  paymentOption: 'deposit' | 'full';
  totalPrice: number;
  depositAmount: number;
  processingFee: number;
  returnUrl: string;
}

export type CheckoutSession =
  | { mode: 'embedded'; clientSecret: string }
  | { mode: 'hosted'; url: string };

export async function createCheckoutSession(
  request: CheckoutRequest
): Promise<CheckoutSession> {
  const body = {
    booking_id: request.bookingId,
    name: request.name,
    email: request.email,
    service_name: request.serviceName,
    return_url: request.returnUrl,
    ...(request.paymentOption === 'full'
      ? { total_price: request.totalPrice + request.processingFee }
      : {
          deposit_amount: request.depositAmount,
          processing_fee: request.processingFee,
        }),
    // Ignored by an edge function that predates embedded support, which then
    // falls through to returning a hosted `url` instead.
    ...(canUseEmbeddedCheckout ? { ui_mode: 'embedded' } : {}),
  };

  const { data, error } = await supabase.functions.invoke('stripe-checkout', { body });

  if (error || !data) {
    throw new Error(error?.message || 'Checkout function returned no data');
  }

  if (typeof data.client_secret === 'string' && data.client_secret) {
    return { mode: 'embedded', clientSecret: data.client_secret };
  }

  if (typeof data.url === 'string' && data.url) {
    return { mode: 'hosted', url: data.url };
  }

  throw new Error(data.error || 'Checkout function returned neither a client secret nor a URL');
}

let hasWarmedUp = false;

/**
 * Pings the checkout function so its container is already running by the time
 * a real request arrives.
 *
 * Supabase Edge Functions are Deno containers that idle down; a cold start can
 * add a second or more to the first call, which is exactly the delay a
 * customer would experience between tapping pay and seeing the card form. The
 * function rejects the empty body before it touches Stripe, so this is
 * side-effect free: no session and no charge are created.
 */
export function warmUpCheckout(): void {
  if (hasWarmedUp || !supabase) return;
  hasWarmedUp = true;

  void (async () => {
    try {
      await supabase.functions.invoke('stripe-checkout', { body: {} });
    } catch {
      // Expected: this request is deliberately incomplete. Only here to warm
      // the container, so any error is irrelevant.
    }
  })();
}
