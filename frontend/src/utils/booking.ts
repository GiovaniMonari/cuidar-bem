export function isMultiDayDuration(durationKey: string) {
  return ['semanal', 'mensal', 'semanal_noite', 'mensal_noite'].includes(durationKey);
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