import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StarIcon, SparkleIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

interface FinalCTASectionProps {
  onBookClick: () => void;
}

export function FinalCTASection({ onBookClick }: FinalCTASectionProps) {
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
          image,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          headline,
          { x: '40vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          cta,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo(
          [sparkle, star],
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'back.out(1.5)', stagger: 0.08 },
          0.15
        );

      // SETTLE (30% - 70%): Hold position

      // EXIT (70% - 100%)
      scrollTl
        .fromTo(
          image,
          { x: 0, opacity: 1 },
          { x: '-18vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          headline,
          { x: 0, opacity: 1 },
          { x: '18vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          cta,
          { x: 0, opacity: 1 },
          { x: '18vw', opacity: 0, ease: 'power2.in' },
          0.72
        )
        .fromTo(
          [sparkle, star],
          { opacity: 1 },
          { opacity: 0, ease: 'power2.in' },
          0.75
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-acid-lime z-[90]"
    >
      {/* Sparkle Icon - Top Left */}
      <SparkleIcon
        ref={sparkleRef}
        className="absolute text-near-black z-40"
        style={{
          left: '10vw',
          top: '12vh',
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />

      {/* Left Image */}
      <div
        ref={imageRef}
        className="absolute z-20"
        style={{
          width: 'min(52vw, 560px)',
          left: '6vw',
          top: '18vh',
        }}
      >
        <div className="image-frame overflow-hidden border-near-black">
          <img
            src="/images/IMG_6897.jpeg"
            alt="Braids detail"
            className="w-full h-auto object-cover"
            style={{ aspectRatio: '4/5' }}
          />
        </div>
      </div>

      {/* Right Headline & CTA */}
      <div
        ref={headlineRef}
        className="absolute z-30"
        style={{
          left: '62vw',
          top: '30vh',
          width: '32vw',
        }}
      >
        <h2 className="heading-xl text-near-black">
          READY
          <br />
          WHEN YOU ARE
        </h2>
        <p className="body-text text-near-black/80 mt-6 max-w-sm">
          Let's get you booked.
        </p>
      </div>

      <div
        ref={ctaRef}
        className="absolute z-30"
        style={{
          left: '62vw',
          top: '58vh',
        }}
      >
        <button
          onClick={onBookClick}
          className="bg-near-black text-acid-lime font-display font-black uppercase text-lg px-10 py-5 border-2 border-near-black hover:bg-near-black/90 transition-colors"
        >
          Book Now
        </button>
      </div>

      {/* Star Icon - Bottom Right */}
      <StarIcon
        ref={starRef}
        className="absolute text-near-black z-40"
        style={{
          left: '90vw',
          top: '72vh',
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />
    </section>
  );
}
