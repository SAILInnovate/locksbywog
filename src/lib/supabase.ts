import { createClient } from '@supabase/supabase-js';

// These will be replaced with actual values when Supabase project is set up
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

export interface Booking {
  id?: string;
  service_id: string;
  name: string;
  email: string;
  phone: string;
  instagram: string;
  notes?: string;
  start_datetime: string;
  end_datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  deposit_amount: number;
  deposit_paid: boolean;
  created_at?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price_from: number;
  duration: string;
  duration_minutes: number;
  image?: string;
}

// Mock services data as fallback
const FALLBACK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Knotless Braids',
    description: 'Lightweight, natural-looking, scalp-friendly braids that last for weeks.',
    price_from: 45,
    duration: '3-5 hours',
    duration_minutes: 240,
  },
  {
    id: '2',
    name: 'Locs & Retwists',
    description: 'Neat parts, clean finish, healthy edges. Keep your locs looking fresh.',
    price_from: 35,
    duration: '2-4 hours',
    duration_minutes: 180,
  },
  {
    id: '3',
    name: "Kids' Styles",
    description: 'Quick, gentle, long-lasting styles for the little ones.',
    price_from: 25,
    duration: '1-3 hours',
    duration_minutes: 120,
  },
  {
    id: '4',
    name: 'Box Braids',
    description: 'Classic protective style with clean parts and professional finish.',
    price_from: 50,
    duration: '4-6 hours',
    duration_minutes: 300,
  },
  {
    id: '5',
    name: 'Cornrows',
    description: 'Sleek, stylish cornrows for any occasion.',
    price_from: 30,
    duration: '1-2 hours',
    duration_minutes: 90,
  },
];

export async function getServices(): Promise<Service[]> {
  if (!supabaseUrl || !supabaseKey) {
    return FALLBACK_SERVICES;
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: false }); // Optional ordering

    if (error || !data) {
      console.warn('Error fetching services from Supabase, returning fallback.', error);
      return FALLBACK_SERVICES;
    }

    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price_from: Number(s.base_price),
      duration: `${s.duration_minutes / 60} hours`,
      duration_minutes: Number(s.duration_minutes),
    }));
  } catch (err) {
    console.error('Failed to fetch services:', err);
    return FALLBACK_SERVICES;
  }
}

// Helper function to create a booking
export async function createBooking(bookingData: Omit<Booking, 'id' | 'created_at'>) {
  // If Supabase is not configured, store in localStorage for demo
  if (!supabaseUrl || !supabaseKey) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const newBooking = {
      ...bookingData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return { data: newBooking, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  return { data, error };
}

// Helper function to get all bookings
export async function getBookings() {
  if (!supabaseUrl || !supabaseKey) {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    return { data: bookings, error: null };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}
