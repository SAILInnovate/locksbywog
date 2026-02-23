import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SparkleIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sparkleRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const portrait = portraitRef.current;
    const headline = headlineRef.current;
    const body = bodyRef.current;
    const sparkle = sparkleRef.current;

    if (!section || !portrait || !headline || !body || !sparkle) return;

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
          .fromTo(portrait, { x: '10vw', opacity: 0, scale: 0.98 }, { x: 0, opacity: 1, scale: 1, ease: 'none' }, 0)
          .fromTo(headline, { x: '-10vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(body, { y: '5vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.1)
          .fromTo(sparkle, { scale: 0.4, rotate: 30, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: 'back.out(1.5)' }, 0.15);

        // EXIT (70% - 100%)
        scrollTl
          .fromTo(portrait, { x: 0, opacity: 1 }, { x: '10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(headline, { x: 0, opacity: 1 }, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(body, { x: 0, opacity: 1 }, { x: '-10vw', opacity: 0, ease: 'power2.in' }, 0.72)
          .fromTo(sparkle, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          [headline, body, portrait],
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
      className="bg-money-green z-30 relative w-full overflow-hidden flex flex-col justify-center py-20 px-6 md:block md:section-pinned"
    >
      {/* Sparkle Icon */}
      <SparkleIcon
        ref={sparkleRef}
        className="absolute text-acid-lime z-40 hidden md:block md:left-[8vw] md:top-[10vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />

      {/* Left Headline & Body */}
      <div
        ref={headlineRef}
        className="relative z-30 mb-6 md:mb-0 mx-auto md:mx-0 md:absolute md:left-[6vw] md:top-[22vh] w-[90vw] md:w-[46vw] text-center md:text-left"
      >
        <h2 className="heading-lg text-off-white text-5xl md:text-5xl lg:text-7xl leading-tight">
          YOUR HAIR IN
          <br className="hidden md:block" />
          {' '}SAFE HANDS
        </h2>
      </div>

      <div
        ref={bodyRef}
        className="relative z-30 mb-10 md:mb-0 mx-auto md:mx-0 md:absolute md:top-[52vh] md:left-[6vw] md:w-[40vw] max-w-[480px] text-center md:text-left"
      >
        <p className="body-text text-off-white/90 leading-relaxed text-base">
          I'm Wog—based in Salford, Manchester. I specialize in neat, long-lasting
          braids and loc styling that protects your hair and keeps you looking fresh.
        </p>
        <p className="body-text text-off-white/90 leading-relaxed mt-4 text-base">
          Every style is crafted with care, precision, and a deep understanding of
          protective styling. Your hair's health is my priority.
        </p>
        <a
          href="#portfolio"
          className="inline-flex items-center justify-center md:justify-start gap-2 mt-6 font-display font-bold text-acid-lime uppercase tracking-wide hover:underline"
        >
          See my work
          <span>→</span>
        </a>
      </div>

      {/* Right Portrait */}
      <div
        ref={portraitRef}
        className="relative z-20 mx-auto md:absolute md:left-[56vw] md:top-[16vh] w-[80vw] md:w-[40vw] max-w-[420px]"
      >
        <div className="image-frame overflow-hidden">
          <img
            src="/images/F0100147-6D85-46E0-869E-030A0181C118.jpeg"
            alt="Happy client with braids"
            className="w-full h-auto object-cover opacity-90"
            style={{ aspectRatio: '3/4' }}
          />
        </div>
      </div>
    </section>
  );
}
