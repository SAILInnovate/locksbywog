/**
 * Site-wide feature switches.
 *
 * Kept in one place so the booking flow can be paused and restored without
 * hunting through components.
 */

/**
 * Master switch for bookings and payments.
 *
 * When false:
 *  - the booking modal is never even downloaded (its chunk is not requested),
 *  - no booking row is written to the database,
 *  - no Stripe Checkout Session is ever created, so no card can be charged.
 *
 * Every "Book now" button instead opens a panel pointing customers at
 * Instagram DMs. Turning this back to true restores the full flow, including
 * embedded checkout, with no other changes.
 */
export const BOOKINGS_ENABLED = false;

/** Instagram handle used for the DM-to-book call to action. */
export const INSTAGRAM_HANDLE = 'locsbywog';

export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;
