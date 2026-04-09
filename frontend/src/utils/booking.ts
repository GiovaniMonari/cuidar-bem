import { AvailabilityDate, AvailabilityTimeRange } from '@/types';

const MULTI_DAY_DURATION_KEYS = [
  'semanal',
  'mensal',
  'semanal_noite',
  'mensal_noite',
];

const LEGACY_SLOT_RANGES: Record<string, AvailabilityTimeRange[]> = {
  manha: [{ startTime: '08:00', endTime: '12:00' }],
  tarde: [{ startTime: '13:00', endTime: '18:00' }],
  noite: [{ startTime: '18:00', endTime: '22:00' }],
  integral: [{ startTime: '08:00', endTime: '22:00' }],
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getNormalizedTimeRanges(day: AvailabilityDate): AvailabilityTimeRange[] {
  if (Array.isArray(day.timeRanges) && day.timeRanges.length > 0) {
    return day.timeRanges;
  }

  if (Array.isArray(day.slots) && day.slots.length > 0) {
    return day.slots.flatMap((slot) => LEGACY_SLOT_RANGES[slot] || []);
  }

  return [];
}

function timeRangeToMinutes(range: AvailabilityTimeRange) {
  const start = parseTimeToMinutes(range.startTime);
  const end = range.endTime === '23:59' ? 1440 : parseTimeToMinutes(range.endTime);
  return end > start ? { start, end } : null;
}

export function isMultiDayDuration(durationKey: string) {
  return MULTI_DAY_DURATION_KEYS.includes(durationKey);
}

export function isHourlyDuration(durationKey: string) {
  return !isMultiDayDuration(durationKey);
}

export function getSuggestedEndDate(startDate: Date, durationKey: string) {
  const end = new Date(startDate);

  if (durationKey === 'semanal' || durationKey === 'semanal_noite') {
    end.setDate(end.getDate() + 6);
    return end;
  }

  if (durationKey === 'mensal' || durationKey === 'mensal_noite') {
    end.setDate(end.getDate() + 29);
    return end;
  }

  return end;
}

export function combineDateAndTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(minutes, 1440));

  if (safeMinutes >= 1440) {
    return '23:59';
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return `${pad(hours)}:${pad(remainingMinutes)}`;
}

export function getComputedEndDateTime(
  startDate: string,
  startTime: string,
  durationHours: number,
) {
  if (!startDate || !startTime || !durationHours) {
    return null;
  }

  const start = new Date(combineDateAndTime(startDate, startTime));
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationHours * 60);

  return {
    dateTime: end,
    endDate: formatDateKey(end),
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  };
}

function getAvailabilityMap(availabilityDates: AvailabilityDate[]) {
  return new Map(
    availabilityDates
      .filter((day) => day.isAvailable)
      .map((day) => [
        day.date,
        getNormalizedTimeRanges(day)
          .map((range) => timeRangeToMinutes(range))
          .filter(
            (range): range is { start: number; end: number } => Boolean(range),
          ),
      ]),
  );
}

function getBookingSegments(start: Date, end: Date) {
  const segments: Array<{ date: string; start: number; end: number }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const startKey = formatDateKey(start);
  const endKey = formatDateKey(end);

  while (cursor <= end) {
    const currentKey = formatDateKey(cursor);
    const segmentStart =
      currentKey === startKey ? start.getHours() * 60 + start.getMinutes() : 0;
    const segmentEnd =
      currentKey === endKey ? end.getHours() * 60 + end.getMinutes() : 1440;

    segments.push({
      date: currentKey,
      start: segmentStart,
      end: Math.max(segmentStart, segmentEnd),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return segments;
}

export function isContinuousIntervalAvailable(
  availabilityDates: AvailabilityDate[],
  startDate: string,
  startTime: string,
  durationHours: number,
) {
  const endData = getComputedEndDateTime(startDate, startTime, durationHours);
  if (!endData) {
    return false;
  }

  const availabilityMap = getAvailabilityMap(availabilityDates);
  const start = new Date(combineDateAndTime(startDate, startTime));

  return getBookingSegments(start, endData.dateTime).every((segment) => {
    const dayRanges = availabilityMap.get(segment.date) || [];

    return dayRanges.some(
      (range) => range.start <= segment.start && range.end >= segment.end,
    );
  });
}

export function getAvailableStartTimes(
  availabilityDates: AvailabilityDate[],
  startDate: string,
  durationHours: number,
  stepMinutes = 30,
) {
  if (!startDate || !durationHours) {
    return [];
  }

  const selectedDay = availabilityDates.find(
    (item) => item.date === startDate && item.isAvailable,
  );

  if (!selectedDay) {
    return [];
  }

  const times = new Set<string>();
  const ranges = getNormalizedTimeRanges(selectedDay)
    .map((range) => timeRangeToMinutes(range))
    .filter(
      (range): range is { start: number; end: number } => Boolean(range),
    );

  for (const range of ranges) {
    for (let minutes = range.start; minutes < range.end; minutes += stepMinutes) {
      const time = formatMinutesToTime(minutes);

      if (
        isContinuousIntervalAvailable(
          availabilityDates,
          startDate,
          time,
          durationHours,
        )
      ) {
        times.add(time);
      }
    }
  }

  return Array.from(times).sort((a, b) => a.localeCompare(b));
}
