// Timezone overlap table (home "How we work"): offsets from Tunis for fixed client regions.
import { utcOffset } from './place';

type Zone = { region: string; timeZone: string };

/** Regions founders typically write from. Offsets are computed at build time. */
const zones: Zone[] = [
  { region: 'London', timeZone: 'Europe/London' },
  { region: 'Paris', timeZone: 'Europe/Paris' },
  { region: 'Dubai', timeZone: 'Asia/Dubai' },
  { region: 'New York', timeZone: 'America/New_York' },
  { region: 'San Francisco', timeZone: 'America/Los_Angeles' },
];

const offsetMinutes = (timeZone: string, date: Date): number => {
  const m = /UTC([+-])(\d+)(?::(\d+))?/.exec(utcOffset(timeZone, date));
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};
const fmt = (min: number) => {
  const d = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
};

type OverlapSettings = {
  location: { timezone: string };
  workingHours?: { start: string | null; end: string | null } | null;
};

export type OverlapSeason = {
  /** "UTC-5" */
  offset: string;
  /** Hours ahead of (+) or behind (-) the base city, e.g. -6. */
  diffHours: number;
  /** "14:00 – 18:00" in that region's local time, only when working hours are set. */
  overlap?: string;
};

export type OverlapRow = {
  region: string;
  /** Standard time (the whole year when the region has no DST). */
  standard: OverlapSeason;
  /** Daylight saving time; only for regions whose offset changes during the year. */
  summer?: OverlapSeason;
};

/**
 * Rows for the timezone table. Offsets are given for standard time and, where the region observes DST,
 * for summer time too, so the table is right whenever the (static) page is read, not just on build day.
 * `overlap` (working hours in the region's local time) is set only when `settings.workingHours` exists.
 */
export function overlapRows(
  settings: OverlapSettings,
  date = new Date(),
): OverlapRow[] {
  const year = date.getUTCFullYear();
  const jan = new Date(Date.UTC(year, 0, 15, 12));
  const jul = new Date(Date.UTC(year, 6, 15, 12));
  const hours = settings.workingHours;
  const season = (timeZone: string, at: Date): OverlapSeason => {
    const diff =
      offsetMinutes(timeZone, at) -
      offsetMinutes(settings.location.timezone, at);
    return {
      offset: utcOffset(timeZone, at),
      diffHours: diff / 60,
      ...(hours?.start && hours?.end
        ? {
            overlap: `${fmt(toMinutes(hours.start) + diff)} – ${fmt(toMinutes(hours.end) + diff)}`,
          }
        : {}),
    };
  };
  return zones.map(({ region, timeZone }) => {
    const a = offsetMinutes(timeZone, jan);
    const b = offsetMinutes(timeZone, jul);
    if (a === b) return { region, standard: season(timeZone, jan) };
    const [std, dst] = a < b ? [jan, jul] : [jul, jan];
    return {
      region,
      standard: season(timeZone, std),
      summer: season(timeZone, dst),
    };
  });
}
