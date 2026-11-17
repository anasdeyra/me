// Language-neutral content: one copy for every locale.
// Lives in src/content/shared/.
import { collection, fields, singleton } from '@keystatic/core';
import { languageCodes, languageLevels, upworkBadges, workModes } from './options';

const isoCountry = (label: string) =>
  fields.text({
    label,
    description: 'ISO 3166-1 alpha-2, e.g. TN',
    validation: { isRequired: true, pattern: { regex: /^[A-Z]{2}$/, message: 'Two capital letters, e.g. TN' } },
  });

const coordinate = (label: string, limit: number) =>
  fields.number({
    label,
    step: 0.0001,
    validation: { isRequired: true, min: -limit, max: limit },
  });

export const settings = singleton({
  label: 'Settings',
  path: 'src/content/shared/settings',
  format: { data: 'yaml' },
  schema: {
    brand: fields.text({ label: 'Brand', defaultValue: 'Deyra', validation: { isRequired: true } }),
    name: fields.text({ label: 'Full name', validation: { isRequired: true } }),
    email: fields.text({
      label: 'Public email',
      validation: {
        isRequired: true,
        pattern: { regex: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email address' },
      },
    }),
    whatsappNumber: fields.text({
      label: 'WhatsApp number',
      description: 'International format, digits only, no "+" or spaces (used for wa.me links)',
      validation: { isRequired: true, pattern: { regex: /^\d{8,15}$/, message: 'Digits only, 8 to 15' } },
    }),
    links: fields.object(
      {
        linkedin: fields.url({ label: 'LinkedIn', validation: { isRequired: true } }),
        github: fields.url({ label: 'GitHub', validation: { isRequired: true } }),
        upwork: fields.url({ label: 'Upwork', validation: { isRequired: true } }),
      },
      { label: 'Profiles' },
    ),
    upwork: fields.object(
      {
        badge: fields.select({ label: 'Badge', options: upworkBadges, defaultValue: 'top-rated' }),
        jobSuccess: fields.integer({
          label: 'Job Success Score (%)',
          validation: { isRequired: true, min: 0, max: 100 },
        }),
        rating: fields.number({
          label: 'Rating',
          step: 0.1,
          validation: { isRequired: true, min: 0, max: 5 },
        }),
        reviews: fields.integer({ label: 'Number of reviews', validation: { isRequired: true, min: 0 } }),
        jobs: fields.text({ label: 'Jobs completed', description: 'As shown on Upwork, e.g. 10+' }),
      },
      { label: 'Upwork record', description: 'Shown in the trust strip; keep in sync with the profile' },
    ),
    location: fields.object(
      {
        city: fields.text({ label: 'City', validation: { isRequired: true } }),
        countryCode: isoCountry('Country'),
        timezone: fields.text({
          label: 'Time zone',
          description: 'IANA name, e.g. Africa/Tunis',
          defaultValue: 'Africa/Tunis',
          validation: { isRequired: true },
        }),
        latitude: coordinate('Latitude', 90),
        longitude: coordinate('Longitude', 180),
      },
      { label: 'Base location', description: 'Home marker on the client map; timezone copy' },
    ),
    languages: fields.array(
      fields.object({
        code: fields.select({ label: 'Language', options: languageCodes, defaultValue: 'en' }),
        level: fields.select({ label: 'Level', options: languageLevels, defaultValue: 'unspecified' }),
      }),
      {
        label: 'Working languages',
        itemLabel: (p) => `${p.fields.code.value} (${p.fields.level.value})`,
      },
    ),
    career: fields.object(
      {
        openToRoles: fields.checkbox({ label: 'Open to full-time roles', defaultValue: true }),
        workModes: fields.multiselect({
          label: 'Work modes',
          options: workModes,
          defaultValue: ['remote', 'hybrid', 'onsite'],
        }),
        openToRelocation: fields.checkbox({ label: 'Open to relocation', defaultValue: true }),
      },
      { label: 'Career (recruiter facts)' },
    ),
    workingHours: fields.object(
      {
        start: fields.text({
          label: 'Start (Tunis time)',
          description: 'HH:MM, 24-hour, e.g. 09:00',
          validation: { pattern: { regex: /^([01]\d|2[0-3]):[0-5]\d$|^$/, message: 'Use HH:MM, e.g. 09:00' } },
        }),
        end: fields.text({
          label: 'End (Tunis time)',
          description: 'HH:MM, 24-hour, e.g. 17:00',
          validation: { pattern: { regex: /^([01]\d|2[0-3]):[0-5]\d$|^$/, message: 'Use HH:MM, e.g. 17:00' } },
        }),
      },
      {
        label: 'Working hours (optional)',
        description: 'Leave empty until confirmed: the timezone overlap column stays hidden',
      },
    ),
  },
});

export const clients = collection({
  label: 'Client countries',
  slugField: 'name',
  path: 'src/content/shared/clients/*',
  format: { data: 'yaml' },
  columns: ['isoCode'],
  schema: {
    name: fields.slug({ name: { label: 'Country' } }),
    isoCode: isoCountry('ISO code'),
    latitude: coordinate('Latitude', 90),
    longitude: coordinate('Longitude', 180),
    projects: fields.integer({
      label: 'Projects (optional)',
      description: 'Shown in the map tooltip when set',
      validation: { min: 1 },
    }),
    visible: fields.checkbox({ label: 'Show on the map', defaultValue: true }),
  },
});
