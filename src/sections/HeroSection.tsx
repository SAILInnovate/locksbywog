import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StarIcon, SparkleIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onBookClick: () => void;
}

export function HeroSection({ onBookClick }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const logoStickerRef = useRef<HTMLDivElement>(null);
  const ctaStickerRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<SVGSVGElement>(null);
  const sparkleRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heroImage = heroImageRef.current;
    const logoSticker = logoStickerRef.current;
    const ctaSticker = ctaStickerRef.current;
    const star = starRef.current;
    const sparkle = sparkleRef.current;

    if (!section || !heroImage || !logoSticker || !ctaSticker || !star || !sparkle) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        // Auto-play entrance animation on load
        const loadTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        loadTl
          .fromTo(heroImage, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 })
          .fromTo(logoSticker, { x: '-12vw', rotate: -12, opacity: 0 }, { x: 0, rotate: -4, opacity: 1, duration: 0.55 }, '-=0.4')
          .fromTo(ctaSticker, { x: '12vw', rotate: 12, opacity: 0 }, { x: 0, rotate: 4, opacity: 1, duration: 0.55 }, '-=0.5')
          .fromTo([star, sparkle], { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)', stagger: 0.1 }, '-=0.3');

        // Scroll-driven exit animation
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=130%',
            pin: true,
            scrub: 0.6,
            onLeaveBack: () => {
              gsap.set([heroImage, logoSticker, ctaSticker, star, sparkle], { opacity: 1, x: 0, y: 0, scale: 1 });
              gsap.set(logoSticker, { rotate: -4 });
              gsap.set(ctaSticker, { rotate: 4 });
            },
          },
        });

        // EXIT phase (70% - 100%)
        scrollTl
          .fromTo(heroImage, { y: 0, scale: 1, opacity: 1 }, { y: '-10vh', scale: 0.92, opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(logoSticker, { x: 0, rotate: -4, opacity: 1 }, { x: '-10vw', rotate: -14, opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(ctaSticker, { x: 0, rotate: 4, opacity: 1 }, { x: '10vw', rotate: 14, opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(star, { x: 0, opacity: 1 }, { x: '8vw', opacity: 0, ease: 'power2.in' }, 0.75)
          .fromTo(sparkle, { x: 0, opacity: 1 }, { x: '-8vw', opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          [heroImage, ctaSticker, star, sparkle],
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="bg-money-green relative w-full overflow-hidden flex flex-col items-center justify-center pt-24 pb-12 px-6 min-h-[90svh] md:min-h-screen md:block md:section-pinned z-10"
    >
      {/* Logo Sticker - Top Left */}
      <div
        ref={logoStickerRef}
        className="hidden md:block absolute md:left-[6vw] md:top-[12vh] z-50 hover:scale-105 transition-transform"
        style={{ transform: 'rotate(-4deg)' }}
      >
        <img
          src="/images/locksbywogggg.png"
          alt="LocksByWog Logo"
          className="h-16 md:h-28 w-auto object-contain drop-shadow-[4px_4px_0_rgba(18,18,18,1)]"
        />
      </div>

      {/* Hero Image - Center */}
      <div
        ref={heroImageRef}
        className="relative z-30 mx-auto w-full flex justify-center md:block md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
      >
        <div className="image-frame overflow-hidden bg-off-white w-[90vw] md:w-[50vw] max-w-[500px]">
          <img
            src="/images/55764726-E9FA-4DD5-BE69-6E0EF95080E7.jpeg"
            alt="Beautiful braids by LocksByWog"
            className="w-full h-auto object-cover"
            style={{ aspectRatio: '4/5' }}
          />
        </div>
      </div>

      {/* CTA Sticker - Bottom Right */}
      <div
        ref={ctaStickerRef}
        className="relative z-50 mt-8 mx-auto text-center md:absolute md:mt-0 md:bottom-auto md:right-auto md:left-[62vw] md:top-[66vh]"
        style={{ transform: 'rotate(4deg)' }}
      >
        <button onClick={onBookClick} className="sticker-lime text-near-black cursor-pointer hover:scale-105 transition-transform">
          <span className="text-base md:text-xl">Book now</span>
        </button>
        <p className="micro-label text-off-white/80 mt-2 md:mt-3 text-center text-xs md:text-sm">
          Salford, Manchester<br className="md:hidden" /> · DM to book
        </p>
      </div>

      {/* Star Icon - Top Right */}
      <StarIcon
        ref={starRef}
        className="absolute text-acid-lime z-40 top-24 right-4 md:left-[82vw] md:top-[12vh] md:right-auto"
        style={{
          width: 'clamp(32px, 5vw, 56px)',
          height: 'clamp(32px, 5vw, 56px)',
        }}
      />

      {/* Sparkle Icon - Bottom Left */}
      <SparkleIcon
        ref={sparkleRef}
        className="absolute text-acid-lime z-40 bottom-24 left-4 md:left-[10vw] md:top-[72vh] md:bottom-auto"
        style={{
          width: 'clamp(32px, 5vw, 56px)',
          height: 'clamp(32px, 5vw, 56px)',
        }}
      />
    </section>
  );
}
