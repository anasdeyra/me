// One data source for /cv (HTML) and /cv.pdf so the two cannot diverge.
import {
  getEducation,
  getExperience,
  getProfile,
  getProjects,
  getSettings,
  getSkills,
} from './content';

export async function getCvData() {
  const [settings, profile, experience, education, skills, projects] =
    await Promise.all([
      getSettings(),
      getProfile(),
      getExperience(),
      getEducation(),
      getSkills(),
      getProjects(),
    ]);
  return {
    settings,
    profile,
    experience,
    education,
    skills,
    researchProjects: projects.filter(
      (p) => p.entry.type.discriminant === 'research',
    ),
    featuredProjects: projects.filter(
      (p) => p.entry.featured && p.entry.type.discriminant !== 'research',
    ),
  };
}

export type CvData = Awaited<ReturnType<typeof getCvData>>;

const monthYear = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));

/** "Jan 2024 – Present" from ISO `YYYY-MM` (or `YYYY-MM-DD`) dates. Plain text for ATS parsers. */
export function formatRange(
  start?: string | null,
  end?: string | null,
  present = 'Present',
): string {
  if (!start) return end ? monthYear(end) : '';
  return `${monthYear(start)} – ${end ? monthYear(end) : present}`;
}
