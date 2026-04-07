'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
  MapPin,
  Phone,
  Clock,
  User,
  FileText,
} from 'lucide-react';

interface BookingItem {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  clientName?: string;
  clientPhone?: string;
  clientId?: any;
  address?: string;
  notes?: string;
  serviceName?: string;
  serviceType?: string;
  durationLabel?: string;
  totalAmount?: number;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

const STATUS_MAP: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export function BookingCalendar({ bookings }: { bookings: BookingItem[] }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingItem[]>();

    bookings.forEach((booking) => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      const current = new Date(start);
      current.setHours(0, 0, 0, 0);

      const final = new Date(end);
      final.setHours(0, 0, 0, 0);

      while (current <= final) {
        const key = formatDate(current);
        const existing = map.get(key) || [];
        existing.push(booking);
        map.set(key, existing);
        current.setDate(current.getDate() + 1);
      }
    });

    return map;
  }, [bookings]);

  const selectedBookings = selectedDate ? bookingsByDate.get(selectedDate) || [] : [];

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekDay = firstDay.getDay();

    const result: (Date | null)[] = [];

    for (let i = 0; i < startWeekDay; i++) result.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(currentYear, currentMonth, d));
    }

    return result;
  }, [currentMonth, currentYear]);

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    'pt-BR',
    { month: 'long', year: 'numeric' },
  );

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-gray-900 capitalize">{monthLabel}</h3>
          </div>

          <button onClick={goNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) return <div key={index} className="h-24" />;

            const key = formatDate(day);
            const dayBookings = bookingsByDate.get(key) || [];
            const isToday = key === formatDate(new Date());

            return (
              <button
                key={key}
                type="button"
                onClick={() => dayBookings.length > 0 && setSelectedDate(key)}
                className={`min-h-[96px] border rounded-xl p-2 text-left transition-all ${
                  dayBookings.length > 0
                    ? 'bg-white hover:border-primary-400 hover:shadow-sm cursor-pointer'
                    : 'bg-gray-50 border-gray-100 cursor-default'
                } ${isToday ? 'ring-2 ring-primary-200 border-primary-300' : 'border-gray-200'}`}
              >
                <div className="text-sm font-semibold text-gray-800 mb-1">
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking._id}
                      className={`text-[10px] px-1.5 py-1 rounded-md truncate ${
                        STATUS_MAP[booking.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.clientName || booking.clientId?.name || 'Cliente'}
                    </div>
                  ))}

                  {dayBookings.length > 2 && (
                    <div className="text-[10px] text-gray-400">
                      +{dayBookings.length - 2} mais
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal do dia */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Agendamentos do dia
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedBookings.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum agendamento nesta data.</p>
              ) : (
                selectedBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {booking.clientName || booking.clientId?.name || 'Cliente'}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {booking.serviceName || booking.serviceType || 'Atendimento'}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold self-start ${
                          STATUS_MAP[booking.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABEL[booking.status] || booking.status}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      {(booking.clientPhone || booking.clientId?.phone) && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {booking.clientPhone || booking.clientId?.phone}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(booking.startDate).toLocaleString('pt-BR')} até{' '}
                        {new Date(booking.endDate).toLocaleString('pt-BR')}
                      </div>

                      {booking.address && (
                        <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {booking.address}
                        </div>
                      )}

                      {booking.notes && (
                        <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {booking.notes}
                        </div>
                      )}
                    </div>

                    {booking.totalAmount && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-right">
                        <span className="text-sm text-gray-500">Valor: </span>
                        <span className="font-bold text-primary-600">
                          R$ {booking.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}