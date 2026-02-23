import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SparkleIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const portrait = portraitRef.current;
    const headline = headlineRef.current;
    const quote = quoteRef.current;
    const sparkle = sparkleRef.current;

    if (!section || !portrait || !headline || !quote || !sparkle) return;

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
          .fromTo(portrait, { x: '-10vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(headline, { x: '10vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(quote, { y: '5vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.1)
          .fromTo(sparkle, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.5)' }, 0.2);

        // EXIT (70% - 100%)
        scrollTl
          .fromTo(portrait, { x: 0, opacity: 1 }, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(headline, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(quote, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.72)
          .fromTo(sparkle, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          [portrait, headline, quote],
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
      id="testimonials"
      className="bg-soft-pink z-[80] relative w-full overflow-hidden flex flex-col justify-center py-20 px-6 md:block md:section-pinned"
    >
      {/* Sparkle Icon */}
      <SparkleIcon
        ref={sparkleRef}
        className="absolute text-near-black z-40 hidden md:block md:left-[90vw] md:top-[12vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />

      {/* Left Portrait */}
      <div
        ref={portraitRef}
        className="relative z-20 mx-auto mb-10 md:mb-0 md:absolute md:left-[6vw] md:top-[18vh] w-[80vw] md:w-[40vw] max-w-[440px]"
      >
        <div className="image-frame overflow-hidden border-near-black">
          <img
            src="/images/F0100147-6D85-46E0-869E-030A0181C118.jpeg"
            alt="Happy client"
            className="w-full h-auto object-cover opacity-90"
            style={{ aspectRatio: '3/4' }}
          />
        </div>
      </div>

      {/* Right Content */}
      <div
        ref={headlineRef}
        className="relative z-30 mx-auto md:mx-0 md:absolute md:left-[52vw] md:top-[26vh] w-[90vw] md:w-[42vw] text-center md:text-left mb-6 md:mb-0"
      >
        <h2 className="heading-lg text-near-black text-5xl md:text-5xl lg:text-7xl leading-tight">
          LOVED BY
          <br className="hidden md:block" />
          {' '}THE CITY
        </h2>
      </div>

      <div
        ref={quoteRef}
        className="relative z-30 mx-auto md:mx-0 md:absolute md:top-[46vh] md:left-[52vw] w-[90vw] md:w-[40vw] max-w-[460px] text-center md:text-left"
      >
        <blockquote className="text-lg md:text-xl text-near-black/90 leading-relaxed italic">
          "Wog is the only person I trust with my hair. Always neat, always on time,
          and my braids last for weeks. The attention to detail is unmatched!"
        </blockquote>
        <p className="mt-6 md:mt-6 font-display font-bold text-near-black uppercase tracking-wide text-sm">
          — Tasha, Manchester
        </p>

        {/* Rating Stars */}
        <div className="flex justify-center md:justify-start gap-1 mt-4">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="#111111"
            >
              <path d="M10 0L12.5 7.5L20 7.5L14 12L16.5 20L10 15L3.5 20L6 12L0 7.5L7.5 7.5L10 0Z" />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}
