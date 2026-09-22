import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';

interface EmbeddedPaymentProps {
  /** Client secret for the Checkout Session, obtained from our edge function. */
  clientSecret: string;
  /** Fired once Stripe has taken the payment. */
  onComplete: () => void;
}

/**
 * Stripe's payment form rendered inside the booking modal.
 *
 * This is the whole point of the embedded flow: the customer never leaves the
 * site, so there is no white flash, no second page load and no wait for the
 * bundle to boot again on the way back from Stripe.
 *
 * This module is imported lazily (see BookingModal) so Stripe's React bindings
 * stay out of the initial bundle.
 */
export default function EmbeddedPayment({ clientSecret, onComplete }: EmbeddedPaymentProps) {
  return (
    <EmbeddedCheckoutProvider
      stripe={getStripe()}
      options={{ clientSecret, onComplete }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
