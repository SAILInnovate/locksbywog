import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StarIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

export function StatementSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const portrait = portraitRef.current;
    const headline = headlineRef.current;
    const star = starRef.current;

    if (!section || !portrait || !headline || !star) return;

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
          .fromTo(
            portrait,
            { x: '-10vw', opacity: 0, scale: 0.96 },
            { x: 0, opacity: 1, scale: 1, ease: 'none' },
            0
          )
          .fromTo(
            headline,
            { x: '10vw', opacity: 0 },
            { x: 0, opacity: 1, ease: 'none' },
            0
          )
          .fromTo(
            star,
            { scale: 0.2, rotate: -25, opacity: 0 },
            { scale: 1, rotate: 0, opacity: 1, ease: 'back.out(1.5)' },
            0.15
          );

        // EXIT (70% - 100%)
        scrollTl
          .fromTo(portrait, { x: 0, opacity: 1 }, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(headline, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(star, { y: 0, opacity: 1 }, { y: '-5vh', opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        // Simple subtle entrance for mobile, no pinning
        gsap.fromTo(
          [portrait, headline],
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
      className="bg-money-green z-20 relative w-full overflow-hidden flex flex-col justify-center py-20 px-6 md:block md:section-pinned"
    >
      {/* Left Portrait */}
      <div
        ref={portraitRef}
        className="relative z-20 mx-auto mb-10 md:mb-0 md:absolute md:left-[6vw] md:top-[18vh] w-[80vw] md:w-[34vw] max-w-[380px]"
      >
        <div className="image-frame overflow-hidden">
          <img
            src="/images/8D00B2A9-ECC2-486F-A168-F1A03A587A76_1_102_o.jpeg"
            alt="Braids close-up"
            className="w-full h-auto object-cover opacity-90"
            style={{ aspectRatio: '3/4' }}
          />
        </div>
      </div>

      {/* Right Headline */}
      <div
        ref={headlineRef}
        className="relative z-30 mx-auto md:mx-0 md:absolute md:left-[46vw] md:top-[34vh] w-[90vw] md:w-[48vw] text-center md:text-left"
      >
        <h2 className="heading-xl text-off-white text-5xl md:text-5xl lg:text-7xl leading-tight text-balance">
          BRAIDS THAT
          <br className="hidden md:block" />
          {' '}HIT DIFFERENT
        </h2>
        <p className="body-text text-off-white/80 mt-4 md:mt-6 max-w-md mx-auto md:mx-0 text-base">
          Neat parts. Clean finish. Zero stress.
        </p>
      </div>

      {/* Star Icon */}
      <StarIcon
        ref={starRef}
        className="absolute text-acid-lime z-40 hidden md:block md:left-[88vw] md:top-[62vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />
    </section>
  );
}
