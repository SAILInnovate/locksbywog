import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Components
import { Navigation } from '@/components/Navigation';
import { BookingModal } from '@/components/BookingModal';

// Sections
import { HeroSection } from '@/sections/HeroSection';
import { StatementSection } from '@/sections/StatementSection';
import { AboutSection } from '@/sections/AboutSection';
import { ServicesSection } from '@/sections/ServicesSection';
import { PortfolioSection } from '@/sections/PortfolioSection';
import { BookingSection } from '@/sections/BookingSection';
import { ServicesListSection } from '@/sections/ServicesListSection';
import { TestimonialsSection } from '@/sections/TestimonialsSection';
import { FinalCTASection } from '@/sections/FinalCTASection';
import { ContactSection } from '@/sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);

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
      <Navigation onBookClick={() => setIsBookingOpen(true)} />

      {/* Main Content */}
      <main ref={mainRef} className="relative">
        <HeroSection onBookClick={() => setIsBookingOpen(true)} />
        <StatementSection />
        <AboutSection />
        <ServicesSection onBookClick={() => setIsBookingOpen(true)} />
        <PortfolioSection />
        <BookingSection onBookClick={() => setIsBookingOpen(true)} />
        <ServicesListSection onBookClick={() => setIsBookingOpen(true)} />
        <TestimonialsSection />
        <FinalCTASection onBookClick={() => setIsBookingOpen(true)} />
        <ContactSection />
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}

export default App;
