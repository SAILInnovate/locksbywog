import { useEffect } from 'react';
import { InstagramIcon } from '@/components/Icons';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/features';

interface BookingsPausedProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Replaces the booking modal while bookings are switched off.
 *
 * Deliberately built without Radix Dialog: importing it here would pull the
 * dialog machinery back into the main bundle, which is exactly the code the
 * lazily-loaded booking modal was split out to avoid. The trade-off is that
 * focus handling is manual, so Escape and the backdrop both close it and the
 * primary action is a real link that works without JavaScript.
 */
export function BookingsPaused({ isOpen, onClose }: BookingsPausedProps) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    // Prevent the page behind the panel from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-near-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookings-paused-title"
    >
      <div
        className="bg-off-white text-near-black border-2 border-near-black rounded-2xl w-full max-w-md p-6 sm:p-8 text-center shadow-[6px_6px_0px_#111] animation-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="micro-label text-money-green">Bookings</p>

        <h2
          id="bookings-paused-title"
          className="font-display font-black uppercase text-2xl sm:text-3xl mt-2 leading-tight"
        >
          Online booking is
          <br />
          taking a quick break
        </h2>

        <p className="body-text text-gray-600 mt-4">
          Slots are arranged by DM for now. Send a message with the style you
          want and your preferred dates, and you&apos;ll get a reply within 24
          hours.
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 w-full inline-flex items-center justify-center gap-2"
        >
          <InstagramIcon size={20} />
          DM @{INSTAGRAM_HANDLE}
        </a>

        <button
          onClick={onClose}
          className="mt-3 w-full text-xs font-display font-bold uppercase tracking-wider text-gray-500 hover:text-near-black transition-colors py-2"
        >
          Back to site
        </button>
      </div>
    </div>
  );
}
