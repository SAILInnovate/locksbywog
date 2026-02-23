import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InstagramIcon, MapPinIcon, ClockIcon } from '@/components/Icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagram: '',
    message: '',
  });

  useEffect(() => {
    const section = sectionRef.current;
    const leftCol = leftColRef.current;
    const form = formRef.current;
    const footer = footerRef.current;

    if (!section || !leftCol || !form) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        leftCol,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: leftCol,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        form,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.1,
          scrollTrigger: {
            trigger: form,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      if (footer) {
        gsap.fromTo(
          footer,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footer,
              start: 'top 95%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSent(true);
    setFormData({ name: '', email: '', instagram: '', message: '' });

    // Reset success message after 5 seconds
    setTimeout(() => setIsSent(false), 5000);
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative bg-soft-pink py-20 md:py-32 z-[100]"
    >
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left Column - Info */}
          <div ref={leftColRef} className="lg:col-span-2">
            <h2 className="heading-lg text-near-black mb-6">
              LET'S TALK
            </h2>
            <p className="body-text text-near-black/80 mb-8 max-w-sm">
              Questions? Want to check availability? Send a message and I'll get back to you within 24 hours.
            </p>

            <div className="space-y-4">
              <a
                href="https://instagram.com/locksbywog"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-near-black hover:text-near-black/70 transition-colors"
              >
                <InstagramIcon size={20} />
                <span className="font-display font-bold">@locksbywog</span>
              </a>

              <div className="flex items-center gap-3 text-near-black">
                <MapPinIcon size={20} />
                <span className="font-display font-bold">Salford, Manchester</span>
              </div>

              <div className="flex items-center gap-3 text-near-black">
                <ClockIcon size={20} />
                <span className="font-display font-bold">Replies within 24 hours</span>
              </div>
            </div>

            {/* Logo */}
            <div className="mt-12">
              <img
                src="/images/locksbywogggg.png"
                alt="LocksByWog Logo"
                className="w-32 h-auto"
              />
            </div>
          </div>

          {/* Right Column - Form */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="lg:col-span-3 bg-off-white border-2 border-near-black p-6 md:p-8"
            style={{ boxShadow: '0 8px 0 rgba(0,0,0,0.15)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="contact-name" className="font-display font-bold uppercase text-sm text-near-black">
                  Your Name
                </Label>
                <Input
                  id="contact-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 border-near-black mt-1"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact-email" className="font-display font-bold uppercase text-sm text-near-black">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-near-black mt-1"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="contact-instagram" className="font-display font-bold uppercase text-sm text-near-black">
                Instagram Handle
              </Label>
              <Input
                id="contact-instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="border-2 border-near-black mt-1"
                placeholder="@yourhandle"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="contact-message" className="font-display font-bold uppercase text-sm text-near-black">
                Message
              </Label>
              <Textarea
                id="contact-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="border-2 border-near-black mt-1 min-h-[120px]"
                placeholder="How can I help you?"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isSent}
              className={`w-full font-display font-black uppercase border-2 border-near-black transition-colors ${
                isSent
                  ? 'bg-money-green text-off-white'
                  : 'bg-acid-lime text-near-black hover:bg-acid-lime/90'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isSent ? (
                <>
                  Message Sent!
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div
          ref={footerRef}
          className="mt-16 pt-8 border-t-2 border-near-black/20"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-near-black/60">
              © {new Date().getFullYear()} LocksByWog. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://instagram.com/locksbywog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-near-black/60 hover:text-near-black transition-colors"
              >
                <InstagramIcon size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
