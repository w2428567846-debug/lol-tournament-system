export const DEFAULT_TOURNAMENT_TIMEZONE = 'Asia/Shanghai';

const dateTimeLocalPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function formatterFor(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
}

function partsAt(instant: number, timeZone: string): DateTimeParts {
  const values = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function partsToEpoch(parts: DateTimeParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

export function isValidTimeZone(timeZone: string) {
  try {
    formatterFor(timeZone).format(0);
    return true;
  } catch {
    return false;
  }
}

export function localDateTimeToUtc(value: string, timeZone: string) {
  const match = dateTimeLocalPattern.exec(value);
  if (!match || !isValidTimeZone(timeZone)) return null;

  const desired: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const desiredEpoch = partsToEpoch(desired);
  const calendarCheck = new Date(desiredEpoch);
  if (
    calendarCheck.getUTCFullYear() !== desired.year
    || calendarCheck.getUTCMonth() + 1 !== desired.month
    || calendarCheck.getUTCDate() !== desired.day
    || desired.hour > 23
    || desired.minute > 59
    || desired.second > 59
  ) return null;

  let candidate = desiredEpoch;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    candidate += desiredEpoch - partsToEpoch(partsAt(candidate, timeZone));
  }

  const resolved = partsAt(candidate, timeZone);
  if (Object.keys(desired).some((key) => resolved[key as keyof DateTimeParts] !== desired[key as keyof DateTimeParts])) return null;
  return new Date(candidate).toISOString();
}

export function toTournamentDateTimeLocal(value: string, timeZone = DEFAULT_TOURNAMENT_TIMEZONE) {
  const instant = new Date(value).getTime();
  if (!Number.isFinite(instant) || !isValidTimeZone(timeZone)) return '';
  const parts = partsAt(instant, timeZone);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
