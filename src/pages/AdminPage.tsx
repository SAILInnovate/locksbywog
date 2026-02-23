import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Lock, Unlock, AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';
import { getBlockedDates, addBlockedDate, removeBlockedDate, getConfirmedBookingsForDate } from '@/lib/supabase';

const ADMIN_PASSWORD = 'Morales';

interface DayInfo {
    date: Date;
    dateStr: string;
    isToday: boolean;
    isPast: boolean;
    isBlocked: boolean;
    hasBookings: boolean;
    bookingCount: number;
}

export function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [blockedDates, setBlockedDates] = useState<string[]>([]);
    const [bookingDates, setBookingDates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDateBookings, setSelectedDateBookings] = useState<any[]>([]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setPasswordError('');
        } else {
            setPasswordError('Wrong password. Try again.');
            setPasswordInput('');
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        const blocked = await getBlockedDates();
        setBlockedDates(blocked);

        // Load booking counts for the current month
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const bookingMap: Record<string, number> = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateObj = new Date(year, month, day);
            if (dateObj >= new Date(new Date().toISOString().split('T')[0])) {
                const bookings = await getConfirmedBookingsForDate(dateStr);
                if (bookings.length > 0) {
                    bookingMap[dateStr] = bookings.length;
                }
            }
        }

        setBookingDates(bookingMap);
        setLoading(false);
    }, [currentMonth]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, loadData]);

    const handleBlockDate = async (dateStr: string) => {
        setActionLoading(dateStr);
        const { error } = await addBlockedDate(dateStr, 'Day off');
        if (!error) {
            setBlockedDates(prev => [...prev, dateStr]);
        }
        setActionLoading(null);
    };

    const handleUnblockDate = async (dateStr: string) => {
        setActionLoading(dateStr);
        const { error } = await removeBlockedDate(dateStr);
        if (!error) {
            setBlockedDates(prev => prev.filter(d => d !== dateStr));
        }
        setActionLoading(null);
    };

    const handleDateClick = async (dayInfo: DayInfo) => {
        if (dayInfo.isPast) return;

        setSelectedDate(dayInfo.dateStr);

        if (dayInfo.hasBookings) {
            const bookings = await getConfirmedBookingsForDate(dayInfo.dateStr);
            setSelectedDateBookings(bookings);
        } else {
            setSelectedDateBookings([]);
        }
    };

    const prevMonth = () => {
        const now = new Date();
        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        if (prev.getFullYear() > now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() >= now.getMonth())) {
            setCurrentMonth(prev);
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const getDaysInMonth = (): DayInfo[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: DayInfo[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            days.push({
                date,
                dateStr,
                isToday: date.getTime() === today.getTime(),
                isPast: date < today,
                isBlocked: blockedDates.includes(dateStr),
                hasBookings: (bookingDates[dateStr] || 0) > 0,
                bookingCount: bookingDates[dateStr] || 0,
            });
        }

        return days;
    };

    const getFirstDayOfWeek = (): number => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        return firstDay === 0 ? 6 : firstDay - 1; // Monday-first
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatSelectedDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    // --- LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-near-black flex items-center justify-center p-6">
                <div className="bg-off-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border-2 border-near-black">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-money-green flex items-center justify-center">
                            <Lock className="text-off-white" size={28} />
                        </div>
                    </div>
                    <h1 className="font-display font-black text-2xl uppercase text-center text-near-black mb-2">
                        Admin Access
                    </h1>
                    <p className="text-center text-near-black/60 text-sm mb-6">
                        Enter the password to manage your availability.
                    </p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-xl border-2 border-near-black/20 bg-white text-near-black placeholder:text-near-black/40 focus:outline-none focus:border-money-green transition-colors text-center text-lg tracking-wider"
                            autoFocus
                        />
                        {passwordError && (
                            <p className="text-red-500 text-sm text-center mt-2 font-medium">{passwordError}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full mt-4 bg-money-green text-off-white font-display font-bold uppercase py-3 rounded-xl hover:bg-money-green/90 transition-colors text-lg tracking-wider"
                        >
                            Log In
                        </button>
                    </form>
                    <a href="/" className="block text-center text-near-black/40 text-xs mt-6 hover:text-near-black/60 transition-colors">
                        ← Back to website
                    </a>
                </div>
            </div>
        );
    }

    // --- ADMIN DASHBOARD ---
    const days = getDaysInMonth();
    const firstDayOffset = getFirstDayOfWeek();
    const isCurrentMonthOrPast = currentMonth.getFullYear() < new Date().getFullYear() ||
        (currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() <= new Date().getMonth());

    return (
        <div className="min-h-screen bg-near-black text-off-white">
            {/* Header */}
            <div className="bg-money-green border-b-2 border-near-black">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-acid-lime" />
                        <h1 className="font-display font-black text-lg sm:text-xl uppercase tracking-wider">Admin</h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <a href="/" className="text-off-white/70 hover:text-off-white text-xs sm:text-sm transition-colors">
                            ← Site
                        </a>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="flex items-center gap-1 sm:gap-2 text-off-white/70 hover:text-off-white text-xs sm:text-sm transition-colors"
                        >
                            <LogOut size={16} />
                            Log out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500/80"></div>
                        <span className="text-off-white/70">Blocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-acid-lime"></div>
                        <span className="text-off-white/70">Has bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-off-white/20"></div>
                        <span className="text-off-white/70">Available</span>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <button
                        onClick={prevMonth}
                        disabled={isCurrentMonthOrPast}
                        className={`p-2 rounded-xl transition-colors ${isCurrentMonthOrPast ? 'text-off-white/20 cursor-not-allowed' : 'bg-off-white/10 hover:bg-off-white/20 text-off-white'}`}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="font-display font-bold text-base sm:text-2xl uppercase tracking-wider text-center">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-xl bg-off-white/10 hover:bg-off-white/20 text-off-white transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-off-white/30 border-t-acid-lime rounded-full"></div>
                        <p className="mt-4 text-off-white/60">Loading calendar...</p>
                    </div>
                ) : (
                    <>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-8">
                            {/* Day headers */}
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="text-center text-off-white/50 text-xs font-bold uppercase py-2">
                                    {day}
                                </div>
                            ))}

                            {/* Empty cells for first day offset */}
                            {Array.from({ length: firstDayOffset }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* Day cells */}
                            {days.map((dayInfo) => {
                                const isSelected = selectedDate === dayInfo.dateStr;
                                const isActionLoading = actionLoading === dayInfo.dateStr;

                                let bgClass = 'bg-off-white/5 hover:bg-off-white/15';
                                if (dayInfo.isPast) bgClass = 'bg-off-white/[0.02] text-off-white/20 cursor-not-allowed';
                                else if (dayInfo.isBlocked) bgClass = 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30';
                                else if (dayInfo.hasBookings) bgClass = 'bg-acid-lime/15 border-acid-lime/30 hover:bg-acid-lime/25';

                                if (isSelected && !dayInfo.isPast) bgClass += ' ring-2 ring-acid-lime';

                                return (
                                    <button
                                        key={dayInfo.dateStr}
                                        onClick={() => handleDateClick(dayInfo)}
                                        disabled={dayInfo.isPast || isActionLoading}
                                        className={`aspect-square rounded-xl border border-off-white/10 flex flex-col items-center justify-center gap-0.5 transition-all relative ${bgClass}`}
                                    >
                                        {isActionLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-near-black/50 rounded-xl">
                                                <div className="w-4 h-4 border-2 border-off-white/30 border-t-acid-lime rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        <span className={`text-sm sm:text-base font-bold ${dayInfo.isToday ? 'text-acid-lime' : ''}`}>
                                            {dayInfo.date.getDate()}
                                        </span>
                                        {dayInfo.isBlocked && !dayInfo.isPast && (
                                            <Lock size={10} className="text-red-400" />
                                        )}
                                        {dayInfo.hasBookings && !dayInfo.isPast && (
                                            <span className="text-[10px] text-acid-lime font-bold">{dayInfo.bookingCount}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Selected Date Panel */}
                        {selectedDate && (
                            <div className="bg-off-white/5 border border-off-white/10 rounded-2xl p-4 sm:p-6 mb-8">
                                <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-wider mb-3 sm:mb-4">
                                    {formatSelectedDate(selectedDate)}
                                </h3>

                                {/* Bookings on this date */}
                                {selectedDateBookings.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-acid-lime font-bold text-sm uppercase mb-2 flex items-center gap-2">
                                            <AlertTriangle size={14} />
                                            {selectedDateBookings.length} confirmed booking{selectedDateBookings.length > 1 ? 's' : ''}
                                        </p>
                                        <div className="space-y-2">
                                            {selectedDateBookings.map((b: any) => (
                                                <div key={b.id} className="bg-off-white/5 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                    <span className="font-medium">{b.name}</span>
                                                    <span className="text-off-white/60">
                                                        {formatTime(b.start_datetime)} – {formatTime(b.end_datetime)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Block / Unblock actions */}
                                {blockedDates.includes(selectedDate) ? (
                                    <button
                                        onClick={() => handleUnblockDate(selectedDate)}
                                        className="flex items-center gap-2 w-full justify-center bg-off-white/10 hover:bg-off-white/20 text-off-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-sm"
                                    >
                                        <Unlock size={16} />
                                        Unblock This Day
                                    </button>
                                ) : (bookingDates[selectedDate] || 0) > 0 ? (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                                        <p className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                                            <AlertTriangle size={14} />
                                            You can't block this date — there are confirmed bookings.
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleBlockDate(selectedDate)}
                                        className="flex items-center gap-2 w-full justify-center bg-red-500/80 hover:bg-red-500 text-off-white font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-sm"
                                    >
                                        <Lock size={16} />
                                        Block This Day Off
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
