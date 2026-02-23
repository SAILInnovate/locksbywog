import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { createBooking, getServices, supabase } from '@/lib/supabase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

export function BookingModal({ isOpen, onClose, preselectedService }: BookingModalProps) {
  const [step, setStep] = useState<'form' | 'deposit' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    instagram: '',
    phone: '',
    service: preselectedService || '',
    date: '',
    time: '',
    notes: '',
  });

  // Watch for preselectedService changes to auto-fill
  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, service: preselectedService }));
    }
  }, [preselectedService]);

  useEffect(() => {
    async function loadServices() {
      if (isOpen) {
        const data = await getServices();
        setServices(data);
      }
    }
    loadServices();
  }, [isOpen]);

  useEffect(() => {
    // Check if coming back from Stripe Checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('booking_success') === 'true') {
      setStep('success');
      // Optional: Clean up URL visually
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Force modal open if we just came back from successful redirect
  // This interacts with App.tsx which might not open the modal immediately.
  // Actually, if we just landed on ?booking_success=true, we might want to force open the modal.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.instagram || !formData.phone || !formData.service || !formData.date || !formData.time) {
      return;
    }
    setStep('deposit');
  };

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
      deposit_amount: 10,
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
      // Local fallback without Supabase config
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
          return_url: `${window.location.origin}?${successParams}`
        }
      });

      if (functionError || !functionData?.url) {
        console.error('Checkout error:', functionError || functionData);
        alert('Could not initiate payment. Please contact us or try again later.');
        setIsSubmitting(false);
        return;
      }

      // Redirect to Stripe checkout url generated
      window.location.href = functionData.url;
    } catch (err) {
      console.error('Network error during checkout:', err);
      alert('Payment initialization failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setFormData({
      name: '',
      email: '',
      instagram: '',
      phone: '',
      service: preselectedService || '',
      date: '',
      time: '',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  const isLateNight = (time: string) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= 22 || hour < 5; // 22:00 onwards
  };

  const selectedServiceDetails = services.find(s => s.name === formData.service);
  const isLate = isLateNight(formData.time);
  const estimatedPrice = selectedServiceDetails ? (isLate ? selectedServiceDetails.price_from * 2 : selectedServiceDetails.price_from) : 0;

  const minDateConfig = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const minDate = minDateConfig.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="bg-off-white text-near-black border-2 border-near-black max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-2xl uppercase">
            {step === 'form' && 'Book Your Slot'}
            {step === 'deposit' && 'Secure Your Booking'}
            {step === 'success' && 'Booking Confirmed!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name" className="font-display font-bold uppercase text-sm">
                Your Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-2 border-near-black mt-1"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="font-display font-bold uppercase text-sm">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-2 border-near-black mt-1"
                placeholder="you@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="instagram" className="font-display font-bold uppercase text-sm">
                Instagram Name *
              </Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="border-2 border-near-black mt-1"
                placeholder="@yourhandle"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="font-display font-bold uppercase text-sm">
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-2 border-near-black mt-1"
                placeholder="+44 7XXX XXXXXX"
                required
              />
            </div>

            <div>
              <Label htmlFor="service" className="font-display font-bold uppercase text-sm">
                Service *
              </Label>
              <Select
                value={formData.service}
                onValueChange={(value) => setFormData({ ...formData, service: value })}
              >
                <SelectTrigger className="border-2 border-near-black mt-1">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} - From £{service.price_from}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="font-display font-bold uppercase text-sm">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border-2 border-near-black mt-1"
                  min={minDate}
                  required
                />
              </div>

              <div>
                <Label htmlFor="time" className="font-display font-bold uppercase text-sm">
                  Time *
                </Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData({ ...formData, time: value })}
                >
                  <SelectTrigger className="border-2 border-near-black mt-1">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="font-display font-bold uppercase text-sm">
                Additional Notes
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border-2 border-near-black mt-1 p-3 rounded-md min-h-[80px] resize-none"
                placeholder="Any special requests or questions..."
              />
            </div>

            <div className="bg-money-green/10 p-4 rounded-md">
              <p className="text-sm font-display font-bold uppercase">Deposit Required</p>
              <p className="text-sm mt-1 mb-3">A £10 deposit is required to secure your booking. This will be deducted from your final payment.</p>

              {formData.service && formData.time && (
                <div className="pt-3 border-t border-acid-lime/30">
                  <p className="text-sm font-semibold">Estimated Service Price: £{estimatedPrice}</p>
                  {isLate && (
                    <p className="text-xs text-money-green font-bold mt-1 bg-acid-lime/20 inline-block px-2 py-1 rounded">
                      Late Night Booking (10 PM+): Premium 2x rate applied.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-acid-lime text-near-black font-display font-black uppercase border-2 border-near-black hover:bg-acid-lime/90"
            >
              Continue to Deposit
            </Button>
          </form>
        )}

        {step === 'deposit' && (
          <div className="space-y-6 mt-4">
            <div className="bg-money-green/10 p-4 rounded-md">
              <h3 className="font-display font-bold uppercase mb-2">Booking Summary</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Name:</span> {formData.name}</p>
                <p><span className="font-semibold">Service:</span> {formData.service}</p>
                <p><span className="font-semibold">Estimated Price:</span> £{estimatedPrice} {isLate ? '(Late Rate)' : ''}</p>
                <p><span className="font-semibold">Date:</span> {formData.date}</p>
                <p><span className="font-semibold">Time:</span> {formData.time}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-4xl font-display font-black">£10.00</p>
              <p className="text-sm text-gray-600 mt-1">Non-refundable deposit</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleDepositPayment}
                disabled={isSubmitting}
                className="w-full bg-acid-lime text-near-black font-display font-black uppercase border-2 border-near-black hover:bg-acid-lime/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay £10 Deposit'
                )}
              </Button>
              <Button
                onClick={() => setStep('form')}
                variant="outline"
                className="w-full border-2 border-near-black font-display font-bold uppercase"
                disabled={isSubmitting}
              >
                Back
              </Button>
            </div>

          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6 mt-4">
            <div className="w-20 h-20 bg-acid-lime rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-near-black" />
            </div>

            <div>
              <p className="text-lg font-semibold">Your booking has been confirmed!</p>
              <p className="text-sm text-gray-600 mt-2">
                We've sent a confirmation to your email. See you soon!
              </p>
            </div>

            <div className="bg-money-green/10 p-4 rounded-md text-left">
              <p className="font-display font-bold uppercase mb-2">Booking Details</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-semibold">Service:</span> {new URLSearchParams(window.location.search).get('service') || formData.service}</p>
                <p><span className="font-semibold">Date:</span> {new URLSearchParams(window.location.search).get('date') || formData.date}</p>
                <p><span className="font-semibold">Time:</span> {new URLSearchParams(window.location.search).get('time') || formData.time}</p>
                <p><span className="font-semibold">Location:</span> Salford, Manchester</p>
              </div>

              <div className="mt-4 pt-3 border-t border-acid-lime/30 text-sm">
                {(() => {
                  const priceParam = new URLSearchParams(window.location.search).get('total_price');
                  // Use param if we just reloaded, otherwise use the estimatedPrice we calculated
                  const total = priceParam ? parseFloat(priceParam) : estimatedPrice;
                  if (total > 0) {
                    return (
                      <p className="font-bold text-money-green">
                        To pay in cash on the day: £{total - 10} <span className="font-normal text-gray-600">(£10 deposit already paid)</span>
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-acid-lime text-near-black font-display font-black uppercase border-2 border-near-black hover:bg-acid-lime/90"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
