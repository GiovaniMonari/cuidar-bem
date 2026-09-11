import {
  isIntervalCoveredByAvailability,
  normalizeAvailabilityCalendar,
} from './availability';

describe('availability utilities', () => {
  it('normalizes legacy slots and sorts the calendar', () => {
    const result = normalizeAvailabilityCalendar([
      {
        date: '2026-09-12',
        timeRanges: [{ startTime: '14:00', endTime: '16:00' }],
      },
      {
        date: '2026-09-11',
        timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
      },
    ] as any);

    expect(result).toEqual([
      expect.objectContaining({
        date: '2026-09-11',
        timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
        isAvailable: true,
      }),
      expect.objectContaining({
        date: '2026-09-12',
        timeRanges: [{ startTime: '14:00', endTime: '16:00' }],
        isAvailable: true,
      }),
    ]);
  });

  it('requires the requested interval to be fully covered', () => {
    const availability = normalizeAvailabilityCalendar([
      {
        date: '2026-09-11',
        timeRanges: [{ startTime: '09:00', endTime: '12:00' }],
        isAvailable: true,
      },
    ] as any);

    expect(
      isIntervalCoveredByAvailability(
        availability,
        new Date('2026-09-11T10:00:00'),
        new Date('2026-09-11T11:30:00'),
      ),
    ).toBe(true);
    expect(
      isIntervalCoveredByAvailability(
        availability,
        new Date('2026-09-11T08:30:00'),
        new Date('2026-09-11T10:00:00'),
      ),
    ).toBe(false);
  });
});