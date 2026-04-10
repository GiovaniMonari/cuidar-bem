'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock3,
  Lock,
  Trash2,
  X,
} from 'lucide-react';
import { AvailabilityDate, AvailabilityTimeRange } from '@/types';

interface Props {
  selectedDates: AvailabilityDate[];
  bookedDates?: string[];
  onChange?: (dates: AvailabilityDate[]) => void;
  onSelectDate?: (date: string) => void;
  selectedDate?: string | null;
  readOnly?: boolean;
  compact?: boolean;
}

const DEFAULT_TIME_RANGE: AvailabilityTimeRange = {
  startTime: '08:00',
  endTime: '18:00',
};

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function getNormalizedTimeRanges(date: AvailabilityDate) {
  if (Array.isArray(date.timeRanges) && date.timeRanges.length > 0) {
    return date.timeRanges;
  }

  return [{ ...DEFAULT_TIME_RANGE }];
}

export function AvailabilityCalendar({
  selectedDates,
  bookedDates = [],
  onChange,
  onSelectDate,
  selectedDate,
  readOnly = false,
  compact = false,
}: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const selectedMap = useMemo(() => {
    const map = new Map<string, AvailabilityDate>();
    selectedDates.forEach((item) =>
      map.set(item.date, {
        ...item,
        timeRanges: getNormalizedTimeRanges(item),
      }),
    );
    return map;
  }, [selectedDates]);

  const [activeEditDate, setActiveEditDate] = useState<string | null>(null);

  const bookedSet = useMemo(() => new Set(bookedDates), [bookedDates]);

  useEffect(() => {
    if (!activeEditDate) return;
    const stillExists = selectedDates.some((item) => item.date === activeEditDate);
    if (!stillExists) {
      setActiveEditDate(null);
    }
  }, [activeEditDate, selectedDates]);

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
    if (readOnly && onSelectDate) {
      onSelectDate(dateStr);
      return;
    }

    if (readOnly || !onChange) return;
    if (bookedSet.has(dateStr)) return;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateObj < now) return;

    const exists = selectedDates.find((d) => d.date === dateStr);

    if (exists) {
      setActiveEditDate(dateStr);
      return;
    }

    onChange([
      ...selectedDates,
        {
          date: dateStr,
          slots: ['integral'],
          timeRanges: [{ ...DEFAULT_TIME_RANGE }],
          isAvailable: true,
        },
    ]);
    setActiveEditDate(dateStr);
  };

  const updateTimeRange = (
    date: string,
    index: number,
    field: keyof AvailabilityTimeRange,
    value: string,
  ) => {
    if (!onChange || readOnly) return;

    onChange(
      selectedDates.map((item) => {
        if (item.date !== date) {
          return item;
        }

        const timeRanges = getNormalizedTimeRanges(item).map((range, rangeIndex) =>
          rangeIndex === index ? { ...range, [field]: value } : range,
        );

        return {
          ...item,
          timeRanges,
        };
      }),
    );
  };

  const addTimeRange = (date: string) => {
    if (!onChange || readOnly) return;

    onChange(
      selectedDates.map((item) =>
        item.date === date
          ? {
              ...item,
              timeRanges: [
                ...getNormalizedTimeRanges(item),
                { ...DEFAULT_TIME_RANGE },
              ],
            }
          : item,
      ),
    );
  };

  const removeTimeRange = (date: string, index: number) => {
    if (!onChange || readOnly) return;

    onChange(
      selectedDates.map((item) => {
        if (item.date !== date) {
          return item;
        }

        const nextRanges = getNormalizedTimeRanges(item).filter(
          (_, rangeIndex) => rangeIndex !== index,
        );

        return {
          ...item,
          timeRanges:
            nextRanges.length > 0 ? nextRanges : [{ ...DEFAULT_TIME_RANGE }],
        };
      }),
    );
  };

  const removeDateAvailability = (date: string) => {
    if (!onChange || readOnly) return;
    onChange(selectedDates.filter((item) => item.date !== date));
    if (activeEditDate === date) {
      setActiveEditDate(null);
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
    <div className={`bg-white rounded-2xl border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
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

      <div className={`grid grid-cols-7 ${compact ? 'gap-1 mb-1' : 'gap-2 mb-2'}`}>
        {weekDays.map((day) => (
          <div
            key={day}
            className={`text-center text-xs font-medium text-gray-400 ${compact ? 'py-1' : 'py-2'}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'}`}>
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className={compact ? 'h-12' : 'h-16'} />;
          }

          const dateStr = formatDate(day);
          const selectedDateItem = selectedMap.get(dateStr);
          const isPicked = selectedDate === dateStr;
          const isSelected = Boolean(selectedDateItem) || isPicked;
          const isBooked = bookedSet.has(dateStr);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          const isToday = formatDate(day) === formatDate(new Date());

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast || isBooked}
              onClick={() => toggleDate(dateStr)}
              className={`${compact ? 'min-h-[48px] text-xs' : 'min-h-[64px] text-sm'} rounded-xl font-medium transition-all border relative px-1 py-2 ${
                isBooked
                  ? 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed'
                  : isSelected
                  ? 'bg-primary-600 text-white border-primary-600'
                  : isToday
                  ? 'border-primary-300 text-primary-700 bg-primary-50'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
              } ${isPast ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1">
                {isBooked ? (
                  <div className="flex items-center justify-center gap-1">
                    <span>{day.getDate()}</span>
                    <Lock className="w-3 h-3" />
                  </div>
                ) : (
                  <span>{day.getDate()}</span>
                )}

                {isSelected && !isBooked && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-90" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!compact && (
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary-600 inline-block" />
          Disponível
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border border-primary-600 inline-flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block" />
          </span>
          Dia selecionado
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
          Dia sem horários livres
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary-50 border border-primary-300 inline-block" />
          Hoje
        </div>
      </div>
      )}

      {activeEditDate && !readOnly && selectedMap.get(activeEditDate) && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {(() => {
              const item = selectedMap.get(activeEditDate);
              if (!item) return null;

              return (
                <>
                  <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Configurar horários
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(item.date + 'T00:00:00').toLocaleDateString(
                          'pt-BR',
                          {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          },
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveEditDate(null)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Fechar"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="text-xs text-gray-500">
                        {item.timeRanges.length} horário
                        {item.timeRanges.length > 1 ? 's' : ''} configurado
                        {item.timeRanges.length > 1 ? 's' : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeDateAvailability(item.date)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Marcar indisponível
                      </button>
                    </div>

                    <div className="space-y-2">
                      {item.timeRanges.map((range, index) => (
                        <div
                          key={`${item.date}-${index}`}
                          className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 border border-gray-200 sm:flex-row sm:items-center"
                        >
                          <div className="grid flex-1 grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={range.startTime}
                              onChange={(event) =>
                                updateTimeRange(
                                  item.date,
                                  index,
                                  'startTime',
                                  event.target.value,
                                )
                              }
                              className="input-field"
                            />
                            <input
                              type="time"
                              value={range.endTime}
                              onChange={(event) =>
                                updateTimeRange(
                                  item.date,
                                  index,
                                  'endTime',
                                  event.target.value,
                                )
                              }
                              className="input-field"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeTimeRange(item.date, index)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                            title="Remover horário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => addTimeRange(item.date)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700"
                      >
                        + Novo horário
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditDate(null)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
