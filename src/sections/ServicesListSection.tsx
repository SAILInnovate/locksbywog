import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getServices } from '@/lib/supabase';
import type { Service } from '@/lib/supabase';
import { ClockIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

interface ServicesListSectionProps {
  onBookClick: (service?: string) => void;
}

export function ServicesListSection({ onBookClick }: ServicesListSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function loadServices() {
      const data = await getServices();
      setServices(data);
    }
    loadServices();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardsRef.current.filter(Boolean);
    const cta = ctaRef.current;

    if (!section || !heading || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        heading,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { y: 40, scale: 0.98, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            delay: index * 0.12,
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // CTA animation
      if (cta) {
        gsap.fromTo(
          cta,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cta,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative bg-money-green py-20 md:py-32 z-[70]"
    >
      <div className="w-full px-6 lg:px-12">
        {/* Heading */}
        <div ref={headingRef} className="mb-12 md:mb-16">
          <h2 className="heading-lg text-off-white mb-4">
            STYLES FOR EVERY VIBE
          </h2>
          <p className="body-text text-off-white/80 max-w-xl">
            From protective styles to fresh retwists—I've got you covered.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={service.id}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="bg-off-white border-2 border-near-black p-6 md:p-8"
              style={{ boxShadow: '0 8px 0 rgba(0,0,0,0.15)' }}
            >
              <h3 className="font-display font-black text-xl md:text-2xl uppercase text-near-black mb-3">
                {service.name}
              </h3>
              <p className="text-near-black/70 text-sm md:text-base mb-4">
                {service.description}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-near-black/60">
                  <ClockIcon size={16} />
                  <span className="text-sm">{service.duration}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-near-black/10">
                <div>
                  <span className="text-xs uppercase text-near-black/50 font-display font-bold">From</span>
                  <p className="font-display font-black text-2xl text-near-black">
                    £{service.price_from}
                  </p>
                </div>
                <button
                  onClick={() => onBookClick(service.name)}
                  className="bg-money-green text-off-white font-display font-bold uppercase text-sm px-5 py-2.5 border-2 border-near-black hover:bg-money-green/90 transition-colors"
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info Card */}
        <div
          ref={(el) => { cardsRef.current[services.length] = el; }}
          className="mt-8 bg-acid-lime border-2 border-near-black p-6 md:p-8"
          style={{ boxShadow: '0 8px 0 rgba(0,0,0,0.15)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-lg uppercase text-near-black mb-2">
                Not sure what you need?
              </h3>
              <p className="text-near-black/70 text-sm md:text-base">
                DM me a photo and I'll recommend the best fit for your hair.
              </p>
            </div>
            <a
              href="https://instagram.com/locksbywog"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-near-black text-acid-lime font-display font-bold uppercase text-sm px-6 py-3 border-2 border-near-black hover:bg-near-black/90 transition-colors text-center whitespace-nowrap"
            >
              DM on Instagram
            </a>
          </div>
        </div>

        {/* CTA */}
        <div ref={ctaRef} className="mt-12 md:mt-16 text-center">
          <button onClick={() => onBookClick()} className="btn-primary">
            Book Your Appointment
          </button>
          <p className="micro-label text-off-white/60 mt-4">
            Full card payment required to secure your slot
          </p>
        </div>
      </div>
    </section>
  );
}
