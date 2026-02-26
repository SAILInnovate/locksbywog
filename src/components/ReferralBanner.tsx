import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Users, Copy, Check } from 'lucide-react';

interface ReferralBannerProps {
    onBookClick: () => void;
}

export function ReferralBanner({ onBookClick }: ReferralBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if user has dismissed the banner before
        const dismissed = sessionStorage.getItem('locksbywog_banner_dismissed');
        if (dismissed) {
            setIsDismissed(true);
            return;
        }

        // Animate in after a short delay
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsDismissed(true);
            sessionStorage.setItem('locksbywog_banner_dismissed', 'true');
        }, 400);
    };

    if (isDismissed) return null;

    return (
        <div
            ref={bannerRef}
            className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
        >
            {/* Main Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-near-black via-[#1a1a2e] to-near-black border-b-2 border-acid-lime/30">
                {/* Animated Background Shimmer */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-acid-lime/20 to-transparent animate-shimmer" />
                </div>

                {/* Particle dots */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1 left-[10%] w-1 h-1 bg-acid-lime rounded-full animate-pulse" />
                    <div className="absolute top-2 left-[30%] w-0.5 h-0.5 bg-acid-lime/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-1 right-[20%] w-1 h-1 bg-acid-lime/80 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-1 left-[50%] w-0.5 h-0.5 bg-acid-lime/40 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute top-2 right-[40%] w-0.5 h-0.5 bg-acid-lime/50 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                </div>

                <div className="relative px-4 py-2.5 md:py-3 flex items-center justify-center gap-2 md:gap-4">
                    {/* Mobile: Compact */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <Sparkles size={16} className="text-acid-lime shrink-0 animate-pulse" />

                        <div className="flex items-center gap-1.5 md:gap-3 text-center">
                            <span className="text-off-white font-display font-bold text-[11px] md:text-sm uppercase tracking-wider">
                                <span className="hidden md:inline">🔥 </span>
                                Got a code?
                            </span>

                            <span className="text-acid-lime font-display font-black text-xs md:text-base uppercase">
                                Save £10
                            </span>

                            <span className="hidden sm:inline text-off-white/60 text-xs">•</span>

                            <span className="hidden sm:inline text-off-white/70 text-[11px] md:text-sm">
                                Enter at checkout
                            </span>
                        </div>

                        <button
                            onClick={onBookClick}
                            className="ml-1 md:ml-2 bg-acid-lime text-near-black font-display font-black text-[10px] md:text-xs uppercase px-3 md:px-4 py-1.5 md:py-2 border border-near-black hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                        >
                            Book Now
                        </button>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-off-white/40 hover:text-off-white transition-colors p-1"
                        aria-label="Dismiss banner"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===========================
// SHARE REFERRAL CODE WIDGET
// ===========================

interface ReferralShareProps {
    code: string;
    onClose?: () => void;
}

export function ReferralShareWidget({ code }: ReferralShareProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const shareText = `Yo bro, use my code "${code}" on locksbywog.com and save £10 on your first booking! 🔥💈`;
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleShareWhatsApp = () => {
        const text = encodeURIComponent(
            `Yo bro, use my code "${code}" on locksbywog.com and save £10 on your booking! 🔥💈 Book here: https://locksbywog.com`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleShareSMS = () => {
        const text = encodeURIComponent(
            `Use my code "${code}" on locksbywog.com and save £10! Book here: https://locksbywog.com`
        );
        window.open(`sms:?body=${text}`, '_blank');
    };

    return (
        <div className="bg-gradient-to-br from-near-black to-[#1a1a2e] border-2 border-acid-lime/30 rounded-2xl p-5 md:p-6 mt-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-acid-lime" />
                <p className="font-display font-black uppercase text-sm text-acid-lime tracking-wider">
                    Your Referral Code
                </p>
            </div>

            <p className="text-off-white/70 text-sm mb-4 leading-relaxed">
                Share this with your mandem — when they use it at checkout, they save <span className="text-acid-lime font-bold">£10</span>. More bookings = more love. 🤝
            </p>

            {/* Code Display */}
            <div className="bg-off-white/5 border-2 border-dashed border-acid-lime/40 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-acid-lime" />
                    <span className="font-mono font-bold text-2xl md:text-3xl text-acid-lime tracking-[0.15em]">
                        {code}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold uppercase transition-all ${copied
                            ? 'bg-acid-lime text-near-black'
                            : 'bg-off-white/10 text-off-white hover:bg-off-white/20'
                        }`}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-display font-bold text-xs uppercase py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                </button>
                <button
                    onClick={handleShareSMS}
                    className="flex items-center justify-center gap-2 bg-off-white/10 text-off-white font-display font-bold text-xs uppercase py-3 rounded-xl hover:bg-off-white/20 hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    💬 Text a Friend
                </button>
            </div>
        </div>
    );
}
