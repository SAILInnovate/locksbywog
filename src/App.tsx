import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Components
import { Navigation } from '@/components/Navigation';
import { BookingModal } from '@/components/BookingModal';
import { ReferralBanner } from '@/components/ReferralBanner';

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
    // Basic cleanup in case there were leftover triggers
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Referral Deal Banner */}
      <ReferralBanner onBookClick={() => handleBookClick()} />

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
