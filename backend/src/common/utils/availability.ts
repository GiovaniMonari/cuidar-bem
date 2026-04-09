export interface AvailabilityTimeRange {
  startTime: string;
  endTime: string;
}

export interface AvailabilityCalendarEntry {
  date: string;
  timeRanges?: AvailabilityTimeRange[];
  slots?: string[];
  isAvailable?: boolean;
}

interface MinuteRange {
  start: number;
  end: number;
}

const LEGACY_SLOT_RANGES: Record<string, AvailabilityTimeRange[]> = {
  manha: [{ startTime: '08:00', endTime: '12:00' }],
  tarde: [{ startTime: '13:00', endTime: '18:00' }],
  noite: [{ startTime: '18:00', endTime: '22:00' }],
  integral: [{ startTime: '08:00', endTime: '22:00' }],
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function isValidTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function toMinuteRange(
  range: Partial<AvailabilityTimeRange> | null | undefined,
): MinuteRange | null {
  if (!range || !isValidTime(range.startTime) || !isValidTime(range.endTime)) {
    return null;
  }

  const start = timeToMinutes(range.startTime);
  const end = range.endTime === '23:59' ? 1440 : timeToMinutes(range.endTime);

  if (end <= start) {
    return null;
  }

  return { start, end };
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const safeValue = Math.max(0, Math.min(value, 1440));

  if (safeValue >= 1440) {
    return '23:59';
  }

  const hours = Math.floor(safeValue / 60);
  const minutes = safeValue % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function mergeMinuteRanges(ranges: MinuteRange[]): MinuteRange[] {
  if (!ranges.length) {
    return [];
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: MinuteRange[] = [sorted[0]];

  for (const current of sorted.slice(1)) {
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

function slotRangesToMinuteRanges(slots: unknown): MinuteRange[] {
  if (!Array.isArray(slots)) {
    return [];
  }

  return mergeMinuteRanges(
    slots
      .flatMap((slot) =>
        typeof slot === 'string' ? LEGACY_SLOT_RANGES[slot] || [] : [],
      )
      .map((range) => toMinuteRange(range))
      .filter((range): range is MinuteRange => Boolean(range)),
  );
}

export function serializeMinuteRanges(
  ranges: MinuteRange[],
): AvailabilityTimeRange[] {
  return mergeMinuteRanges(ranges)
    .filter((range) => range.end > range.start)
    .map((range) => ({
      startTime: minutesToTime(range.start),
      endTime: minutesToTime(range.end),
    }));
}

export function normalizeAvailabilityCalendar(
  availabilityCalendar: AvailabilityCalendarEntry[] = [],
): AvailabilityCalendarEntry[] {
  const byDate = new Map<
    string,
    { timeRanges: MinuteRange[]; slots: string[]; isAvailable: boolean }
  >();

  for (const item of availabilityCalendar) {
    if (!item || typeof item.date !== 'string') {
      continue;
    }

    const calendarDate = item.date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
      continue;
    }

    const rawRanges = Array.isArray(item.timeRanges) && item.timeRanges.length > 0
      ? item.timeRanges
          .map((range) => toMinuteRange(range))
          .filter((range): range is MinuteRange => Boolean(range))
      : slotRangesToMinuteRanges(item.slots);

    if (!rawRanges.length) {
      continue;
    }

    const existing = byDate.get(calendarDate) || {
      timeRanges: [],
      slots: [],
      isAvailable: false,
    };

    byDate.set(calendarDate, {
      timeRanges: mergeMinuteRanges([...existing.timeRanges, ...rawRanges]),
      slots: Array.from(
        new Set(
          [...existing.slots, ...(Array.isArray(item.slots) ? item.slots : [])].filter(
            (slot): slot is string => typeof slot === 'string' && slot.length > 0,
          ),
        ),
      ),
      isAvailable: item.isAvailable !== false,
    });
  }

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, value]) => ({
      date,
      slots: value.slots,
      timeRanges: serializeMinuteRanges(value.timeRanges),
      isAvailable: value.isAvailable,
    }));
}

function getDateTimeMinutes(date: Date, roundUp = false): number {
  const baseMinutes = date.getHours() * 60 + date.getMinutes();
  const hasPartialMinute = date.getSeconds() > 0 || date.getMilliseconds() > 0;

  return roundUp && hasPartialMinute ? baseMinutes + 1 : baseMinutes;
}

export function getBookingSegmentsByDate(startDate: Date, endDate: Date) {
  const segments: Array<{ date: string; start: number; end: number }> = [];

  const startKey = formatLocalDate(startDate);
  const endKey = formatLocalDate(endDate);
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    const currentKey = formatLocalDate(cursor);
    const segmentStart =
      currentKey === startKey ? getDateTimeMinutes(startDate) : 0;
    const segmentEnd =
      currentKey === endKey ? getDateTimeMinutes(endDate, true) : 1440;

    segments.push({
      date: currentKey,
      start: segmentStart,
      end: Math.max(segmentStart, segmentEnd),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return segments;
}

export function subtractMinuteRanges(
  availableRanges: MinuteRange[],
  blockedRanges: MinuteRange[],
): MinuteRange[] {
  let remaining = mergeMinuteRanges(availableRanges);
  const mergedBlocked = mergeMinuteRanges(blockedRanges);

  for (const blocked of mergedBlocked) {
    remaining = remaining.flatMap((range) => {
      if (blocked.end <= range.start || blocked.start >= range.end) {
        return [range];
      }

      const nextRanges: MinuteRange[] = [];

      if (blocked.start > range.start) {
        nextRanges.push({ start: range.start, end: blocked.start });
      }

      if (blocked.end < range.end) {
        nextRanges.push({ start: blocked.end, end: range.end });
      }

      return nextRanges;
    });
  }

  return mergeMinuteRanges(
    remaining.filter((range) => range.end > range.start),
  );
}

export function isIntervalCoveredByAvailability(
  availabilityCalendar: AvailabilityCalendarEntry[] = [],
  startDate: Date,
  endDate: Date,
): boolean {
  const normalized = normalizeAvailabilityCalendar(availabilityCalendar);
  const availabilityMap = new Map<string, MinuteRange[]>(
    normalized.map((item) => [
      item.date,
      (item.timeRanges || [])
        .map((range) => toMinuteRange(range))
        .filter((range): range is MinuteRange => Boolean(range)),
    ]),
  );

  return getBookingSegmentsByDate(startDate, endDate).every((segment) => {
    const ranges = availabilityMap.get(segment.date) || [];

    return ranges.some(
      (range) => range.start <= segment.start && range.end >= segment.end,
    );
  });
}
