import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Components
import { Navigation } from '@/components/Navigation';
import { BookingModal } from '@/components/BookingModal';

// Sections
import { PortfolioSection } from '@/sections/PortfolioSection';
import { ServicesListSection } from '@/sections/ServicesListSection';
import { TestimonialsSection } from '@/sections/TestimonialsSection';
import { ContactSection } from '@/sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('booking_success') === 'true';
  });
  const [preselectedService, setPreselectedService] = useState('');
  const [existingBooking, setExistingBooking] = useState<{ service: string, date: string, time: string, total_price: number } | null>(null);

  const mainRef = useRef<HTMLElement>(null);
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);

  const handleBookClick = (serviceName?: string) => {
    if (serviceName) {
      setPreselectedService(serviceName);
    } else {
      setPreselectedService('');
    }
    setIsBookingOpen(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem('locksbywog_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const bookingDate = new Date(`${parsed.date}T${parsed.time}:00`);
        if (bookingDate >= new Date()) {
          setExistingBooking(parsed);
        } else {
          localStorage.removeItem('locksbywog_booking');
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // Wait for all ScrollTriggers to be created
    const setupSnap = () => {
      // Get all pinned ScrollTriggers
      const allTriggers = ScrollTrigger.getAll();
      const pinned = allTriggers
        .filter((st) => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);

      if (!maxScroll || pinned.length === 0) return;

      // Build ranges and snap targets from pinned sections
      const pinnedRanges = pinned.map((st) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      // Create global snap
      snapTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            // Check if within any pinned range (allow small buffer)
            const inPinned = pinnedRanges.some(
              (r) => value >= r.start - 0.02 && value <= r.end + 0.02
            );

            // If not in a pinned section, allow free scroll
            if (!inPinned) return value;

            // Find nearest pinned center
            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );

            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    };

    // Delay to ensure all section ScrollTriggers are created
    const timer = setTimeout(setupSnap, 500);

    return () => {
      clearTimeout(timer);
      if (snapTriggerRef.current) {
        snapTriggerRef.current.kill();
      }
    };
  }, []);

  // Refresh ScrollTrigger on resize
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Navigation */}
      <Navigation onBookClick={() => handleBookClick()} />

      {/* Main Content */}
      <main ref={mainRef} className="relative">
        <PortfolioSection onBookClick={() => handleBookClick()} />
        <ServicesListSection onBookClick={handleBookClick} />
        <TestimonialsSection />
        <ContactSection />
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedService={preselectedService}
      />

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
