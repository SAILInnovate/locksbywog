import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { StarIcon } from '@/components/Icons';

export function PortfolioSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  ]);

  const images = [
    "/images/55764726-E9FA-4DD5-BE69-6E0EF95080E7.jpeg",
    "/images/8D00B2A9-ECC2-486F-A168-F1A03A587A76_1_102_o.jpeg",
    "/images/C89B76A9-EF3F-446C-9C48-656D6E35529C_1_102_o.jpeg",
    "/images/D41E79E1-2CB9-4DCF-95FC-C84481C152D4_4_5005_c.jpeg",
    "/images/F0100147-6D85-46E0-869E-030A0181C118.jpeg",
    "/images/IMG_6897.jpeg",
    "/images/anotherdisplayimage.png"
  ];

  return (
    <section id="portfolio" className="bg-money-green z-50 relative w-full overflow-hidden py-16 md:py-24">
      <div className="container mx-auto px-6 mb-8 flex flex-col md:flex-row items-end justify-between">
        <div className="relative z-30 flex-1 max-w-2xl">
          <h2 className="heading-lg text-off-white text-4xl md:text-5xl lg:text-7xl uppercase">
            Looks For Every Mood
          </h2>
          <p className="body-text text-off-white/80 mt-4 md:mt-4 text-lg">
            Protective styles that last. Scroll through the latest work.
          </p>
        </div>

        <StarIcon
          className="text-acid-lime hidden md:block w-12 h-12 mt-4 md:mt-0 animate-[spin_10s_linear_infinite]"
        />
      </div>

      <div className="embla w-full pl-6 md:pl-8 lg:pl-16 relative z-20 cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="embla__container flex">
          {images.map((src, index) => (
            <div className="embla__slide flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_35%] lg:flex-[0_0_28%] pr-4 md:pr-6" key={index}>
              <div className="image-frame overflow-hidden h-full">
                <img
                  src={src}
                  alt={`Locks by Wog Portfolio ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  style={{ aspectRatio: '4/5' }}
                  loading={index < 3 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-center mt-8 gap-4 px-6 relative z-30">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="w-12 h-12 rounded-full border-2 border-off-white text-off-white flex items-center justify-center hover:bg-off-white hover:text-money-green transition-colors"
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="w-12 h-12 rounded-full border-2 border-off-white text-off-white flex items-center justify-center hover:bg-off-white hover:text-money-green transition-colors"
          aria-label="Next image"
        >
          →
        </button>
      </div>
    </section>
  );
}
