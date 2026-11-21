// Select options shared by the Keystatic schemas. Values are stable identifiers;
// display labels on the site come from src/i18n, not from these labels.

export const projectTypes = [
  { label: 'Professional (client or employer case study)', value: 'client' },
  { label: 'Side project', value: 'side' },
  { label: 'Research', value: 'research' },
] as const;

export const researchStatuses = [
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Published', value: 'published' },
] as const;

export const postTypes = [
  { label: 'Article', value: 'article' },
  { label: 'Note', value: 'note' },
] as const;

export const postCtas = [
  { label: 'Auto (from pillar tag)', value: 'auto' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Related project + WhatsApp', value: 'project' },
  { label: 'View CV', value: 'cv' },
  { label: 'None', value: 'none' },
] as const;

export const upworkBadges = [
  { label: 'Rising Talent', value: 'rising-talent' },
  { label: 'Top Rated', value: 'top-rated' },
  { label: 'Top Rated Plus', value: 'top-rated-plus' },
  { label: 'Expert-Vetted', value: 'expert-vetted' },
] as const;

export const languageCodes = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Arabic', value: 'ar' },
] as const;

export const languageLevels = [
  { label: 'Not specified yet', value: 'unspecified' },
  { label: 'Native', value: 'native' },
  { label: 'Bilingual', value: 'bilingual' },
  { label: 'Fluent', value: 'fluent' },
  { label: 'Professional working', value: 'professional' },
  { label: 'Conversational', value: 'conversational' },
] as const;

export const workModes = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'On-site', value: 'onsite' },
] as const;

export const employmentTypes = [
  { label: 'Full-time', value: 'full-time' },
  { label: 'Part-time', value: 'part-time' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
] as const;

export const testimonialSources = [
  { label: 'Upwork', value: 'upwork' },
  { label: 'Direct', value: 'direct' },
] as const;
