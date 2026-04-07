'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';

interface AvailabilityDate {
  date: string;
  slots: string[];
  isAvailable: boolean;
}

interface Props {
  selectedDates: AvailabilityDate[];
  onChange?: (dates: AvailabilityDate[]) => void;
  readOnly?: boolean;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function sameMonth(date: Date, month: number, year: number) {
  return date.getMonth() === month && date.getFullYear() === year;
}

export function AvailabilityCalendar({
  selectedDates,
  onChange,
  readOnly = false,
}: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const selectedMap = useMemo(() => {
    const map = new Map<string, AvailabilityDate>();
    selectedDates.forEach((item) => map.set(item.date, item));
    return map;
  }, [selectedDates]);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const result: (Date | null)[] = [];

    for (let i = 0; i < startWeekDay; i++) {
      result.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      result.push(new Date(currentYear, currentMonth, day));
    }

    return result;
  }, [currentMonth, currentYear]);

  const toggleDate = (dateStr: string) => {
    if (readOnly || !onChange) return;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateObj < now) return;

    const exists = selectedDates.find((d) => d.date === dateStr);

    if (exists) {
      onChange(selectedDates.filter((d) => d.date !== dateStr));
    } else {
      onChange([
        ...selectedDates,
        {
          date: dateStr,
          slots: ['integral'],
          isAvailable: true,
        },
      ]);
    }
  };

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    'pt-BR',
    {
      month: 'long',
      year: 'numeric',
    },
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 capitalize">
            {monthLabel}
          </h3>
        </div>

        <button
          type="button"
          onClick={goNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-12" />;
          }

          const dateStr = formatDate(day);
          const isSelected = selectedMap.has(dateStr);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          const isToday = formatDate(day) === formatDate(new Date());

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => toggleDate(dateStr)}
              className={`h-12 rounded-xl text-sm font-medium transition-all border ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600'
                  : isToday
                  ? 'border-primary-300 text-primary-700 bg-primary-50'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
              } ${isPast ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary-600 inline-block" />
          Disponível
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary-50 border border-primary-300 inline-block" />
          Hoje
        </div>
      </div>
    </div>
  );
}