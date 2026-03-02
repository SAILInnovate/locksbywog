import { useEffect, useState } from 'react';
import { Check, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { createBooking, getServices, getBookedSlotsForDate, getBlockedDates, supabase } from '@/lib/supabase';
import type { Service } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'service' | 'datetime' | 'details' | 'deposit' | 'success';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

const getMinDate = () => {
  const minDateConfig = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  return minDateConfig.toISOString().split('T')[0];
};

export function BookingModal({ isOpen, onClose, preselectedService }: BookingModalProps) {
  const [step, setStep] = useState<Step>('service');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ start_datetime: string, end_datetime: string }[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagram: '',
    phone: '',
    service: '',
    date: getMinDate(),
    time: '',
    notes: '',
  });

  useEffect(() => {
    async function loadServices() {
      if (isOpen && services.length === 0) {
        const data = await getServices();
        setServices(data);
      }
    }
    loadServices();
  }, [isOpen, services.length]);

  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search);
      if (preselectedService) {
        setFormData(prev => ({ ...prev, service: preselectedService }));
        setStep('datetime');
      } else {
        if (params.get('booking_success') === 'true') {
          setStep('success');
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          setStep('service');
        }
      }
    }
  }, [isOpen, preselectedService]);

  useEffect(() => {
    async function loadBookedSlots() {
      if (formData.date) {
        const slots = await getBookedSlotsForDate(formData.date);
        setBookedSlots(slots);
      } else {
        setBookedSlots([]);
      }
    }
    loadBookedSlots();
  }, [formData.date]);

  useEffect(() => {
    async function loadBlockedDates() {
      if (isOpen) {
        const dates = await getBlockedDates();
        setBlockedDates(dates);
      }
    }
    loadBlockedDates();
  }, [isOpen]);

  const handleDepositPayment = async () => {
    setIsSubmitting(true);

    const selectedServiceDetails = services.find(s => s.name === formData.service);
    if (!selectedServiceDetails) {
      alert('Selected service not found.');
      setIsSubmitting(false);
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + selectedServiceDetails.duration_minutes * 60000);

    const isLateNightTime = (time: string) => {
      const hour = parseInt(time.split(':')[0], 10);
      return hour >= 22 || hour < 5;
    };
    const isLate = isLateNightTime(formData.time);
    const estimatedPrice = isLate ? selectedServiceDetails.price_from * 2 : selectedServiceDetails.price_from;

    // Create booking
    const { data: bData, error } = await createBooking({
      service_id: selectedServiceDetails.id,
      name: formData.name,
      email: formData.email,
      instagram: formData.instagram,
      phone: formData.phone,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      deposit_paid: false,
      deposit_amount: estimatedPrice,
      total_price: estimatedPrice,
      notes: formData.notes,
      status: 'pending',
    });

    if (error || !bData || bData.length === 0) {
      console.error(error);
      alert('Something went wrong creating the booking. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const bookingId = bData[0].id;

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setIsSubmitting(false);
      setStep('success');
      return;
    }

    try {
      const successParams = new URLSearchParams({
        booking_success: 'true',
        service: selectedServiceDetails.name,
        date: formData.date,
        time: formData.time,
        total_price: estimatedPrice.toString()
      }).toString();

      const { data: functionData, error: functionError } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          booking_id: bookingId,
          name: formData.name,
          email: formData.email,
          service_name: selectedServiceDetails.name,
          total_price: estimatedPrice,
          return_url: `${window.location.origin}?${successParams}`
        }
      });

      if (functionError || !functionData?.url) {
        console.error('Checkout error:', functionError || functionData);
        alert('Could not initiate payment. Please contact us or try again later.');
        setIsSubmitting(false);
        return;
      }

      // Save successful booking intent to local storage so user sees a reminder later
      localStorage.setItem('locksbywog_booking', JSON.stringify({
        service: selectedServiceDetails.name,
        date: formData.date,
        time: formData.time,
        total_price: estimatedPrice
      }));

      // Redirect to Stripe checkout url generated
      window.location.href = functionData.url;
    } catch (err) {
      console.error('Network error during checkout:', err);
      alert('Payment initialization failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      instagram: '',
      phone: '',
      service: '',
      date: getMinDate(),
      time: '',
      notes: '',
    });
    setStep('service');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (step === 'datetime') setStep('service');
    else if (step === 'details') setStep('datetime');
    else if (step === 'deposit') setStep('details');
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  const isLateNight = (time: string) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= 22 || hour < 5;
  };

  const selectedServiceDetails = services.find(s => s.name === formData.service);
  const isLate = isLateNight(formData.time);
  const basePrice = selectedServiceDetails ? (isLate ? selectedServiceDetails.price_from * 2 : selectedServiceDetails.price_from) : 0;
  const estimatedPrice = basePrice;

  const isTimeSlotAvailable = (timeStart: string) => {
    if (!selectedServiceDetails || !formData.date) return true;

    const startDateTime = new Date(`${formData.date}T${timeStart}:00`);
    const endDateTime = new Date(startDateTime.getTime() + selectedServiceDetails.duration_minutes * 60000);

    for (const slot of bookedSlots) {
      const bStart = new Date(slot.start_datetime);
      const bEnd = new Date(slot.end_datetime);

      const bEndWithBuffer = new Date(bEnd.getTime() + 3 * 60 * 60 * 1000); // 3-hour buffer
      const endDateTimeWithBuffer = new Date(endDateTime.getTime() + 3 * 60 * 60 * 1000); // 3-hour buffer

      // Check overlap (new start < existing end + 3h AND new end + 3h > existing start)
      if (startDateTime < bEndWithBuffer && endDateTimeWithBuffer > bStart) {
        return false; // Overlap found
      }
    }
    return true; // No overlap
  };

  const minDate = getMinDate();
  const isInvalidDate = formData.date ? formData.date < minDate : false;
  const isBlockedDate = formData.date ? blockedDates.includes(formData.date) : false;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="bg-off-white text-near-black border-2 border-near-black max-w-lg max-h-[90vh] overflow-x-hidden overflow-y-auto w-[95vw] sm:w-[90vw] rounded-2xl p-5 sm:p-6 !box-border">

        <DialogHeader className="relative pb-4">
          {step !== 'service' && step !== 'success' && (
            <button
              onClick={handleBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 -mt-2 p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0 z-10"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <DialogTitle className="font-display font-black text-2xl uppercase text-center w-full">
            {step === 'service' && 'Select Service'}
            {step === 'datetime' && 'Date & Time'}
            {step === 'details' && 'Your Details'}
            {step === 'deposit' && 'Secure Booking'}
            {step === 'success' && 'Confirmed!'}
          </DialogTitle>
        </DialogHeader>

        {/* PROGRESS BAR */}
        {step !== 'success' && (
          <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-acid-lime h-full transition-all duration-500 ease-out"
              style={{ width: step === 'service' ? '25%' : step === 'datetime' ? '50%' : step === 'details' ? '75%' : '100%' }}
            />
          </div>
        )}

        <div className="pt-2">
          {/* STEP 1: SERVICE */}
          {step === 'service' && (
            <div className="space-y-3 animation-fade-in">
              {services.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setFormData({ ...formData, service: svc.name }); setStep('datetime'); }}
                  className="w-full text-left p-4 rounded-xl border-2 border-black/10 hover:border-near-black transition-all flex justify-between items-center group bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    <h4 className="font-display font-bold uppercase text-lg">{svc.name}</h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Clock size={14} className="inline opacity-70" /> {svc.duration}
                      <span className="opacity-40">•</span>
                      <span className="font-bold text-money-green">From £{svc.price_from}</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-near-black flex items-center justify-center group-hover:bg-acid-lime transition-colors shrink-0">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: DATETIME */}
          {step === 'datetime' && (
            <div className="space-y-8 animation-fade-in">
              <div className="bg-money-green/10 p-4 rounded-xl border border-money-green/20">
                <p className="font-display font-bold uppercase text-sm mb-1 text-money-green">Selected Service</p>
                <p className="font-semibold">{formData.service} <span className="font-normal text-gray-600">({selectedServiceDetails?.duration})</span></p>
              </div>

              <div className="w-full">
                <Label className={`font-display font-bold uppercase text-sm mb-3 flex items-center gap-2 ${isInvalidDate ? 'text-red-600' : ''}`}>
                  <CalendarIcon size={18} /> 1. Select Date
                </Label>
                <div className="w-full max-w-full overflow-hidden block box-border relative">
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value, time: '' }); // Reset time when date changes
                    }}
                    className={`border-2 p-3 sm:p-4 h-auto text-base sm:text-lg w-full max-w-full rounded-xl transition-all cursor-pointer box-border block appearance-none ${isInvalidDate
                      ? 'border-red-500 bg-red-50/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-700'
                      : 'border-black/20 focus:border-near-black'
                      }`}
                    min={minDate}
                    required
                  />
                  {isInvalidDate && (
                    <p className="text-red-600 text-[11px] sm:text-xs font-bold mt-2 font-display uppercase tracking-wide">
                      ⚠ Please select a date at least 2 days from now.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-display font-bold uppercase text-sm flex items-center gap-2">
                  <Clock size={14} /> 2. Select Time
                </Label>

                {!formData.date ? (
                  <div className="p-6 bg-black/5 rounded-xl border-2 border-dashed border-black/10 text-center">
                    <p className="text-gray-500 font-medium">Please pick a date first to see available slots.</p>
                  </div>
                ) : isBlockedDate ? (
                  <div className="p-6 bg-red-50 rounded-xl border-2 border-red-200 text-center">
                    <p className="text-red-600 font-bold text-sm uppercase">🚫 Not available on this day</p>
                    <p className="text-red-500 text-xs mt-1">Please choose a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {timeSlots.map((time) => {
                      const available = isTimeSlotAvailable(time);
                      const isSelected = formData.time === time;
                      return (
                        <button
                          key={time}
                          disabled={!available}
                          onClick={() => setFormData({ ...formData, time })}
                          className={`py-3 px-2 rounded-xl border-2 text-[15px] font-bold transition-all duration-200 ${isSelected
                            ? 'bg-near-black border-near-black text-acid-lime scale-105 shadow-md'
                            : available
                              ? 'border-black/10 hover:border-near-black text-gray-700 bg-white hover:bg-black/5'
                              : 'border-black/5 bg-black/5 text-gray-400 line-through cursor-not-allowed opacity-50'
                            }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  if (isInvalidDate) {
                    alert("Please select a date at least 2 days from now.");
                    return;
                  }
                  if (!formData.date || !formData.time) {
                    alert("Please select both a valid date and a time.");
                    return;
                  }
                  setStep('details');
                }}
                disabled={!formData.date || !formData.time || isInvalidDate || isBlockedDate}
                className="w-full bg-acid-lime text-near-black border-2 border-near-black font-display font-bold uppercase py-7 text-lg hover:bg-acid-lime/80 disabled:opacity-50 disabled:hover:scale-100 hover:scale-[1.02] active:scale-95 transition-all shadow-[4px_4px_0px_#111] hover:shadow-[2px_2px_0px_#111] disabled:shadow-none"
              >
                Next step
              </Button>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 'details' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              setStep('deposit');
            }} className="space-y-5 animation-fade-in">

              <div>
                <Label htmlFor="name" className="font-display font-bold uppercase text-xs text-gray-500 tracking-wider">Your Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 border-black/10 focus:border-near-black mt-1 p-4 h-auto rounded-xl transition-colors bg-white font-medium text-lg"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="font-display font-bold uppercase text-xs text-gray-500 tracking-wider">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-black/10 focus:border-near-black mt-1 p-4 h-auto rounded-xl transition-colors bg-white font-medium text-lg"
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram" className="font-display font-bold uppercase text-xs text-gray-500 tracking-wider">Instagram *</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="border-2 border-black/10 focus:border-near-black mt-1 p-4 h-auto rounded-xl transition-colors bg-white font-medium text-lg"
                    placeholder="@yourhandle"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="font-display font-bold uppercase text-xs text-gray-500 tracking-wider">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-2 border-black/10 focus:border-near-black mt-1 p-4 h-auto rounded-xl transition-colors bg-white font-medium text-lg"
                    placeholder="+44 7XXX XXXXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="font-display font-bold uppercase text-xs text-gray-500 tracking-wider">Any Note? (Optional)</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border-2 border-black/10 focus:border-near-black mt-1 p-4 rounded-xl min-h-[100px] resize-none focus:outline-none transition-colors bg-white font-medium text-base"
                  placeholder="Hair length, specific requests, etc..."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-acid-lime text-near-black border-2 border-near-black font-display font-black uppercase py-7 text-lg hover:bg-acid-lime/80 hover:scale-[1.02] active:scale-95 transition-all shadow-[4px_4px_0px_#111] hover:shadow-[2px_2px_0px_#111]"
              >
                Review & Secure Booking
              </Button>
            </form>
          )}

          {/* STEP 4: DEPOSIT */}
          {step === 'deposit' && (
            <div className="space-y-6 animation-fade-in">
              <div className="bg-money-green/10 p-5 rounded-2xl border border-money-green/20">
                <h3 className="font-display font-black uppercase text-lg mb-4 flex items-center gap-2">
                  <Check className="text-money-green" size={20} strokeWidth={3} /> Booking Summary
                </h3>

                <div className="space-y-3 text-[15px]">
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-gray-500 font-medium">Service</span>
                    <span className="font-bold text-right">{formData.service}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-gray-500 font-medium">Date & Time</span>
                    <span className="font-bold text-right">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/5 pb-2 items-start">
                    <span className="text-gray-500 font-medium shrink-0">Location</span>
                    <div className="text-right">
                      <span className="font-bold">Manchester</span>
                      <span className="block text-[11px] font-normal text-gray-500 mt-0.5 leading-tight">(Full address & postcode<br />provided upon booking)</span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="flex justify-between border-b border-black/5 pb-2">
                    <span className="text-gray-500 font-medium">Service Price</span>
                    <span className="font-bold">£{basePrice}</span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-gray-500 font-medium">Estimated Total</span>
                    <div className="text-right">
                      <span className="font-bold text-lg">£{estimatedPrice}</span>
                      {isLate && <div className="block mt-1"><span className="text-[11px] text-money-green font-bold bg-acid-lime/20 px-2 py-0.5 rounded uppercase tracking-wider">Late Rate Applied</span></div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center bg-black-[0.03] border-2 border-dashed border-black/10 p-6 rounded-2xl">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Due Today</p>
                <p className="text-6xl font-display font-black tracking-tight text-near-black">£{estimatedPrice}</p>
                <p className="text-sm text-gray-500 mt-2 max-w-[250px] mx-auto leading-tight">Pay the full amount via card to secure this exact slot.</p>
              </div>

              <Button
                onClick={handleDepositPayment}
                disabled={isSubmitting}
                className="w-full bg-near-black text-acid-lime border-2 border-near-black font-display font-black uppercase py-8 text-xl hover:bg-near-black/90 hover:scale-[1.02] active:scale-95 transition-all shadow-[4px_4px_0px_#c3ff00] hover:shadow-[2px_2px_0px_#c3ff00]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Pay Securely & Finish'
                )}
              </Button>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-4 animation-fade-in">
              <div className="w-24 h-24 bg-acid-lime rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_#111]">
                <Check className="w-12 h-12 text-near-black" strokeWidth={3} />
              </div>

              <div>
                <h2 className="text-3xl font-display font-black uppercase">Slot Secured!</h2>
                <p className="text-base text-gray-600 mt-3 max-w-[300px] mx-auto">
                  We've sent a detailed confirmation to your email. I'll reach out on Instagram soon!
                </p>
              </div>

              <div className="bg-money-green/5 p-5 rounded-2xl border-2 border-money-green/10 text-left">
                <p className="font-display font-bold uppercase text-money-green mb-3 tracking-wide">Final Details</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500 inline-block w-20">Service:</span> <span className="font-bold">{new URLSearchParams(window.location.search).get('service') || formData.service || "Booking"}</span></p>
                  <p><span className="text-gray-500 inline-block w-20">Date:</span> <span className="font-bold">{new URLSearchParams(window.location.search).get('date') || formData.date}</span></p>
                  <p><span className="text-gray-500 inline-block w-20">Time:</span> <span className="font-bold">{new URLSearchParams(window.location.search).get('time') || formData.time}</span></p>
                  <p><span className="text-gray-500 inline-block w-20">Where:</span> <span className="font-bold">Salford (M6 6DQ)</span></p>
                </div>


              </div>

              <Button
                onClick={handleClose}
                className="w-full bg-near-black text-white font-display font-bold uppercase py-6 text-lg rounded-full hover:bg-near-black/80 transition-colors"
              >
                Back To Website
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
