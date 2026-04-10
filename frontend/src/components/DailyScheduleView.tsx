'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface BookedSlot {
  startTime: string;
  endTime: string;
  clientName?: string;
  serviceName?: string;
}

interface DailyScheduleViewProps {
  date: string;
  timeRanges: TimeRange[];
  bookedSlots?: BookedSlot[];
  selectedStartTime?: string;
  onSelectTimeRange?: (startTime: string, endTime: string) => void;
  readOnly?: boolean;
  durationHours?: number;
}

export function DailyScheduleView({
  date,
  timeRanges,
  bookedSlots = [],
}: DailyScheduleViewProps) {

  // Criar grid de horas (8h às 22h)
  const hours = useMemo(() => {
    const hoursArray = [];
    for (let i = 8; i <= 22; i++) {
      hoursArray.push(i);
    }
    return hoursArray;
  }, []);

  // Converter tempo para posição em pixels (cada hora = 60px)
  const timeStringToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getPositionFromTime = (minutes: number): number => {
    const earliestHour = 8 * 60; // Começa às 8h (480 minutos)
    const minutesFromEarliestHour = Math.max(0, minutes - earliestHour);
    return (minutesFromEarliestHour / 60) * 60; // 60px por hora
  };

  const getDurationInPixels = (startMinutes: number, endMinutes: number): number => {
    const durationMinutes = Math.max(0, endMinutes - startMinutes);
    return (durationMinutes / 60) * 60; // 60px por hora, sem subtrair 8h
  };

  // Processar disponibilidades para renderizar blocos
  const availableSlots = useMemo(() => {
    return timeRanges.map((range) => {
      const startMinutes = timeStringToMinutes(range.startTime);
      const endMinutes = timeStringToMinutes(range.endTime);
      const startPx = getPositionFromTime(startMinutes);
      const durationPx = getDurationInPixels(startMinutes, endMinutes);

      return {
        startTime: range.startTime,
        endTime: range.endTime,
        top: startPx,
        height: Math.max(durationPx, 45), // Mínimo 45px
        type: 'available' as const,
      };
    });
  }, [timeRanges]);

  // Processar agendamentos ocupados
  const occupiedSlots = useMemo(() => {
    return bookedSlots.map((slot) => {
      const startMinutes = timeStringToMinutes(slot.startTime);
      const endMinutes = timeStringToMinutes(slot.endTime);
      const startPx = getPositionFromTime(startMinutes);
      const durationPx = getDurationInPixels(startMinutes, endMinutes);

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        clientName: slot.clientName,
        serviceName: slot.serviceName,
        top: startPx,
        height: Math.max(durationPx, 45),
        type: 'booked' as const,
      };
    });
  }, [bookedSlots]);

  // Combinar e ordenar todos os slots
  const allSlots = useMemo(() => {
    return [...availableSlots, ...occupiedSlots].sort(
      (a, b) => a.top - b.top
    );
  }, [availableSlots, occupiedSlots]);

  const configuredAvailability = useMemo(
    () =>
      timeRanges.map((range) => ({
        label: `${range.startTime} - ${range.endTime}`,
      })),
    [timeRanges],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
          <span>
            {availableSlots.length} período{availableSlots.length !== 1 ? 's' : ''} disponível{availableSlots.length !== 1 ? 'is' : ''}
          </span>
          {occupiedSlots.length > 0 && (
            <span className="text-red-600">
              {occupiedSlots.length} indisponível{occupiedSlots.length !== 1 ? 'is' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="md:hidden space-y-2">
        {allSlots.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum horário disponível</p>
          </div>
        ) : (
          allSlots.map((slot, idx) => (
            <div
              key={`slot-mobile-${idx}-${slot.startTime}`}
              className={`rounded-xl border p-3 ${
                slot.type === 'available'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    slot.type === 'available' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {slot.type === 'available' ? 'Disponível' : 'Indisponível'}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.max(
                    1,
                    Math.round(
                      (timeStringToMinutes(slot.endTime) -
                        timeStringToMinutes(slot.startTime)) /
                        60,
                    ),
                  )}
                  h
                </span>
              </div>
              <p
                className={`mt-1 text-sm font-semibold ${
                  slot.type === 'available' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {slot.startTime} - {slot.endTime}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50">
          <div className="w-16 flex-shrink-0 border-r border-gray-100 px-3 py-2 text-center">
            <p className="text-xs font-semibold text-gray-500">Hora</p>
          </div>
          <div className="flex-1 px-4 py-2">
            <p className="text-xs font-semibold text-gray-500">Agenda do dia</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex min-w-[620px]">
            <div className="w-14 sm:w-16 flex-shrink-0 border-r border-gray-100 bg-gray-50">
              {hours.map((hour, idx) => (
                <div
                  key={`hour-${hour}`}
                  className="h-[60px] border-b border-gray-100 px-2 text-xs text-gray-500 font-semibold flex items-start justify-center pt-1.5"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="flex-1 relative bg-white" style={{ minHeight: '900px' }}>
              <div className="absolute inset-0 pointer-events-none">
                {hours.map((hour, idx) => (
                  <div
                    key={`line-${hour}`}
                    className={`h-[60px] ${idx < hours.length - 1 ? 'border-b border-gray-100' : ''}`}
                  />
                ))}
              </div>

              <div className="relative" style={{ height: '900px' }}>
                {allSlots.map((slot, idx) => (
                  <div
                    key={`slot-${idx}-${slot.startTime}`}
                    className={`absolute left-3 right-3 rounded-lg border-2 overflow-hidden flex flex-col
                    ${
                      slot.type === 'available'
                        ? 'border-green-300 bg-green-50 hover:bg-green-100'
                        : 'border-red-300 bg-red-50 cursor-not-allowed opacity-80'
                    }
                    `}
                    style={{
                      top: `${slot.top}px`,
                      height: `${slot.height}px`,
                      minHeight: '45px',
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full px-2">
                      {slot.type === 'available' ? (
                        <>
                          <span className="text-xs font-bold text-green-900">
                            {slot.startTime}
                          </span>
                          <span className="text-xs text-green-700">
                            {slot.endTime}
                          </span>
                          {slot.height > 60 && (
                            <span className="text-xs text-green-600 mt-0.5">
                              {Math.round((timeStringToMinutes(slot.endTime) - timeStringToMinutes(slot.startTime)) / 60)}h
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-red-900">
                            Indisponível
                          </span>
                          <span className="text-xs text-red-700 mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {allSlots.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Nenhum horário disponível</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-600 px-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-300"></div>
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-300"></div>
          <span>Indisponível</span>
        </div>
      </div>
    </div>
  );
}
