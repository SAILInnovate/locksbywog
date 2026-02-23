import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StarIcon } from '@/components/Icons';

gsap.registerPlugin(ScrollTrigger);

export function PortfolioSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const image1Ref = useRef<HTMLDivElement>(null);
  const image2Ref = useRef<HTMLDivElement>(null);
  const image3Ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image1 = image1Ref.current;
    const image2 = image2Ref.current;
    const image3 = image3Ref.current;
    const headline = headlineRef.current;
    const star = starRef.current;

    if (!section || !image1 || !image2 || !image3 || !headline || !star) return;

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
          .fromTo(image1, { x: '-30vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0)
          .fromTo(image2, { y: '-30vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.05)
          .fromTo(image3, { x: '30vw', opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0.1)
          .fromTo(headline, { y: '25vh', opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.1)
          .fromTo(star, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(1.5)' }, 0.2);

        // EXIT (70% - 100%)
        scrollTl
          .fromTo(image1, { x: 0, opacity: 1 }, { x: '-12vw', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(image2, { y: 0, opacity: 1 }, { y: '-10vh', opacity: 0, ease: 'power2.in' }, 0.72)
          .fromTo(image3, { x: 0, opacity: 1 }, { x: '12vw', opacity: 0, ease: 'power2.in' }, 0.74)
          .fromTo(headline, { y: 0, opacity: 1 }, { y: '12vh', opacity: 0, ease: 'power2.in' }, 0.7)
          .fromTo(star, { opacity: 1 }, { opacity: 0, ease: 'power2.in' }, 0.75);
      });

      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          [headline, image1, image2, image3],
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
      id="portfolio"
      className="bg-money-green z-50 relative w-full overflow-hidden flex flex-col justify-center py-20 px-6 md:block md:section-pinned"
    >
      {/* Bottom Headline */}
      <div
        ref={headlineRef}
        className="relative z-30 mb-10 mx-auto text-center md:text-left md:absolute md:left-[6vw] md:top-[62vh] md:w-[62vw]"
      >
        <h2 className="heading-lg text-off-white text-4xl md:text-5xl lg:text-7xl">
          LOOKS FOR EVERY MOOD
        </h2>
        <p className="body-text text-off-white/80 mt-4 md:mt-4">
          Protective styles that last.
        </p>
      </div>

      {/* Top Row Images */}
      <div className="relative z-20 w-full grid grid-cols-2 gap-4 md:block">
        <div
          ref={image1Ref}
          className="col-span-2 relative md:absolute md:left-[6vw] md:top-[14vh] w-full md:w-[28vw] max-w-[320px] mx-auto"
        >
          <div className="image-frame overflow-hidden">
            <img
              src="/images/D41E79E1-2CB9-4DCF-95FC-C84481C152D4_4_5005_c.jpeg"
              alt="Locs in progress"
              className="w-full h-auto object-cover opacity-90"
              style={{ aspectRatio: '4/5' }}
            />
          </div>
        </div>

        <div
          ref={image2Ref}
          className="relative md:absolute md:left-[36vw] md:top-[14vh] w-full md:w-[28vw] max-w-[320px] mx-auto mt-4 md:mt-0"
        >
          <div className="image-frame overflow-hidden">
            <img
              src="/images/IMG_6897.jpeg"
              alt="Styled locs"
              className="w-full h-auto object-cover opacity-90"
              style={{ aspectRatio: '4/5' }}
            />
          </div>
        </div>

        <div
          ref={image3Ref}
          className="relative md:absolute md:left-[66vw] md:top-[14vh] w-full md:w-[28vw] max-w-[320px] mx-auto mt-4 md:mt-0"
        >
          <div className="image-frame overflow-hidden">
            <img
              src="/images/55764726-E9FA-4DD5-BE69-6E0EF95080E7.jpeg"
              alt="Braids style"
              className="w-full h-auto object-cover opacity-90"
              style={{ aspectRatio: '4/5' }}
            />
          </div>
        </div>
      </div>

      {/* Star Icon */}
      <StarIcon
        ref={starRef}
        className="absolute text-acid-lime z-40 hidden md:block md:left-[88vw] md:top-[70vh]"
        style={{
          width: 'clamp(28px, 4vw, 48px)',
          height: 'clamp(28px, 4vw, 48px)',
        }}
      />
    </section>
  );
}
