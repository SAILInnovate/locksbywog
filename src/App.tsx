import { useEffect, useState, useRef, Suspense, lazy } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Components
import { Navigation } from '@/components/Navigation';

/*
 * The booking modal (and with it Radix's dialog machinery) is split out of the
 * main bundle. It is prefetched during idle time below, so by the time a
 * visitor taps "Book now" the chunk is already in cache and the modal opens
 * without a wait.
 */
const BookingModal = lazy(() =>
  import('@/components/BookingModal').then((m) => ({ default: m.BookingModal }))
);

// Sections
import { PortfolioSection } from '@/sections/PortfolioSection';
import { ServicesListSection } from '@/sections/ServicesListSection';
import { TestimonialsSection } from '@/sections/TestimonialsSection';
import { ContactSection } from '@/sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shown only in the brief window before the lazily-loaded booking modal chunk
 * arrives. In practice the idle prefetch below means it never appears, but if
 * the visitor is on a slow connection they get feedback instead of a dead tap.
 */
function BookingModalFallback({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-near-black/60 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="bg-off-white border-2 border-near-black rounded-2xl p-8 w-full max-w-sm text-center shadow-[6px_6px_0px_#111]">
        <p className="font-display font-black uppercase tracking-wide text-lg">
          Opening booking…
        </p>
        <div className="pay-progress mt-4 bg-black/10" />
      </div>
    </div>
  );
}

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('booking_success') === 'true';
  });
  const [preselectedService, setPreselectedService] = useState('');
  const [existingBooking, setExistingBooking] = useState<{ service: string, date: string, time: string, total_price: number } | null>(null);

  const mainRef = useRef<HTMLElement>(null);

  const handleBookClick = (serviceName?: string) => {
    if (serviceName) {
      setPreselectedService(serviceName);
    } else {
      setPreselectedService('');
    }
    setIsBookingOpen(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem('locsbywog_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const bookingDate = new Date(`${parsed.date}T${parsed.time}:00`);
        if (bookingDate >= new Date()) {
          setExistingBooking(parsed);
        } else {
          localStorage.removeItem('locsbywog_booking');
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // Basic cleanup in case there were leftover triggers
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  useEffect(() => {
    // Fetch the booking modal chunk once the browser is idle. It is the one
    // part of the flow a visitor cannot reach without a deliberate tap, so
    // there is no reason to make the first paint wait for it - but it should
    // still be ready before anyone actually asks for it.
    const prefetch = () => {
      void import('@/components/BookingModal');
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(prefetch, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Navigation - offset for banner */}
      <Navigation onBookClick={() => handleBookClick()} />

      {/* Main Content */}
      <main ref={mainRef} className="relative">
        <PortfolioSection onBookClick={() => handleBookClick()} />
        <ServicesListSection onBookClick={handleBookClick} />
        <TestimonialsSection />
        <ContactSection />
      </main>

      {/* Booking Modal */}
      <Suspense fallback={<BookingModalFallback isOpen={isBookingOpen} />}>
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          preselectedService={preselectedService}
        />
      </Suspense>

      {/* Return Customer Booking Reminder */}
      {existingBooking && (
        <div className="bg-acid-lime text-near-black py-3 px-6 fixed bottom-0 left-0 right-0 z-[100] border-t-2 border-near-black shadow-lg flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-2">
          <p className="font-display font-bold uppercase text-sm md:text-base">
            📅 Upcoming Appointment: {existingBooking.service} on {existingBooking.date} at {existingBooking.time}
          </p>
          <button
            onClick={() => {
              setExistingBooking(null);
            }}
            className="text-xs uppercase font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

export default App;
