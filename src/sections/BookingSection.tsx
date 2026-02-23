import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StarIcon, SparkleIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

interface BookingSectionProps {
  onBookClick: () => void;
}

export function BookingSection({ onBookClick }: BookingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<SVGSVGElement>(null);
  const starRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const headline = headlineRef.current;
    const cta = ctaRef.current;
    const sparkle = sparkleRef.current;
    const star = starRef.current;

    if (!section || !image || !headline || !cta || !sparkle || !star) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.6,
          },
        });

        // ENTRANCE (0% - 30%)
        scrollTl
          .fromTo(image, { x: '-10vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(headline, { x: '10vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(cta, { y: '10vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.1)
          .fromTo([sparkle, star], { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.5)', stagger: 0.08 }, 0.15);

        // EXIT (70% - 100%)
        scrollTl
          .fromTo(image, { x: 0, opacity: 1 }, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(headline, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(cta, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.72)
          .fromTo([sparkle, star], { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          [image, headline, cta],
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-money-green z-[60] relative w-full overflow-hidden flex flex-col justify-center py-20 px-6 md:block md:section-pinned"
    >
      {/* Sparkle Icon - Top Left */}
      <SparkleIcon
        ref={sparkleRef}
        className="absolute text-acid-lime z-40 hidden md:block md:left-[10vw] md:top-[12vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />

      {/* Left Image */}
      <div
        ref={imageRef}
        className="relative z-20 mx-auto mb-10 md:mb-0 md:absolute md:left-[6vw] md:top-[18vh] w-[85vw] md:w-[52vw] max-w-[560px]"
      >
        <div className="image-frame overflow-hidden">
          <img
            src="/images/8D00B2A9-ECC2-486F-A168-F1A03A587A76_1_102_o.jpeg"
            alt="Braids booking"
            className="w-full h-auto object-cover opacity-90"
            style={{ aspectRatio: '4/5' }}
          />
        </div>
      </div>

      {/* Right Headline & CTA */}
      <div
        ref={headlineRef}
        className="relative z-30 mx-auto md:mx-0 md:absolute md:left-[62vw] md:top-[30vh] w-[90vw] md:w-[32vw] text-center md:text-left"
      >
        <h2 className="heading-xl text-off-white text-5xl md:text-5xl lg:text-7xl leading-tight">
          BOOK
          <br className="hidden md:block" />
          {' '}YOUR SLOT
        </h2>
        <p className="body-text text-off-white/80 mt-4 md:mt-6 max-w-sm mx-auto md:mx-0 text-base">
          Weekends fill fast—secure your spot.
        </p>
      </div>

      <div
        ref={ctaRef}
        className="relative z-30 mx-auto md:mx-0 md:absolute md:left-[62vw] md:top-[58vh] flex flex-col gap-4 mt-8 md:mt-0 w-[80vw] md:w-[24vw]"
      >
        <button onClick={onBookClick} className="btn-primary w-full">
          Book Now
        </button>
        <a
          href="#services"
          className="font-display font-bold text-off-white/80 uppercase text-sm tracking-wide hover:text-off-white transition-colors text-center"
        >
          View pricing →
        </a>
      </div>

      {/* Star Icon - Bottom Right */}
      <StarIcon
        ref={starRef}
        className="absolute text-acid-lime z-40 hidden md:block md:left-[90vw] md:top-[72vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />
    </section>
  );
}
