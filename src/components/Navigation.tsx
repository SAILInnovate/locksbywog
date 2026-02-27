import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onBookClick: () => void;
}

export function Navigation({ onBookClick }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMenuOpen(false);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled
          ? 'bg-money-green/95 backdrop-blur-sm py-3 shadow-md'
          : 'bg-transparent py-6'
          }`}
      >
        <div className="w-full px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollToSection('hero')}
            className="hover:rotate-[-2deg] hover:scale-105 transition-transform duration-300"
          >
            <img
              src="/images/locksbywogggg.png"
              alt="LocsByWog Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('portfolio')}
              className="font-display font-bold text-sm uppercase tracking-wide text-off-white/80 hover:text-off-white transition-colors"
            >
              Work
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="font-display font-bold text-sm uppercase tracking-wide text-off-white/80 hover:text-off-white transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="font-display font-bold text-sm uppercase tracking-wide text-off-white/80 hover:text-off-white transition-colors"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="font-display font-bold text-sm uppercase tracking-wide text-off-white/80 hover:text-off-white transition-colors"
            >
              Contact
            </button>
            <button
              onClick={onBookClick}
              className="bg-acid-lime text-near-black font-display font-black text-sm uppercase px-5 py-2.5 border-2 border-near-black hover:-translate-y-0.5 hover:scale-[1.02] transition-transform"
            >
              Book
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-off-white p-2"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-money-green transition-transform duration-300 md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <button
            onClick={() => scrollToSection('portfolio')}
            className="font-display font-black text-3xl uppercase text-off-white hover:text-acid-lime transition-colors"
          >
            Work
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="font-display font-black text-3xl uppercase text-off-white hover:text-acid-lime transition-colors"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection('testimonials')}
            className="font-display font-black text-3xl uppercase text-off-white hover:text-acid-lime transition-colors"
          >
            Reviews
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="font-display font-black text-3xl uppercase text-off-white hover:text-acid-lime transition-colors"
          >
            Contact
          </button>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onBookClick();
            }}
            className="mt-4 bg-acid-lime text-near-black font-display font-black text-xl uppercase px-8 py-4 border-2 border-near-black"
          >
            Book Now
          </button>
        </div>
      </div>
    </>
  );
}
