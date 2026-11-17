// Translatable content, one set per locale under src/content/<locale>/.
// Each factory takes the locale so adding FR is `projects_fr: projects('fr')` in keystatic.config.ts.
// Images without a `directory` are stored next to their entry (folder-per-entry layout).
import { collection, fields, singleton } from '@keystatic/core';
import {
  employmentTypes,
  postCtas,
  postTypes,
  projectTypes,
  researchStatuses,
  testimonialSources,
} from './options';

const base = (locale: string) => `src/content/${locale}`;
const draft = (defaultValue = false) =>
  fields.checkbox({
    label: 'Draft',
    description: 'Drafts show in dev only and are excluded from production builds',
    defaultValue,
  });
const textList = (label: string, itemLabel: string) =>
  fields.array(fields.text({ label: itemLabel, validation: { isRequired: true } }), {
    label,
    itemLabel: (p) => p.value,
  });

export const profile = (locale: string) =>
  singleton({
    label: 'Profile',
    path: `${base(locale)}/profile/`,
    format: { data: 'yaml' },
    schema: {
      title: fields.text({
        label: 'Professional title',
        description: 'e.g. Full-stack Engineer (CV, Person schema)',
        validation: { isRequired: true },
      }),
      shortBio: fields.text({
        label: 'Short bio',
        description: '2-3 lines: about teaser and default meta description',
        multiline: true,
        validation: { isRequired: true, length: { max: 300 } },
      }),
      cvSummary: fields.text({
        label: 'CV summary',
        description: '3 lines with role keywords (ATS)',
        multiline: true,
      }),
      photo: fields.image({ label: 'Photo' }),
      cutout: fields.image({
        label: 'Hero cutout (optional)',
        description:
          'The same portrait as a transparent PNG (background removed, shoulders reaching the bottom and side edges). Shown in the home hero; without it the hero shows the photo.',
      }),
      photoAlt: fields.text({ label: 'Photo alt text' }),
      longBio: fields.markdoc({ label: 'Long bio (About page)' }),
      howIWork: fields.markdoc({ label: 'How I work (About page, optional)' }),
      researchSummary: fields.text({
        label: 'Research summary (About page, optional)',
        multiline: true,
      }),
      facts: fields.array(
        fields.object({
          label: fields.text({ label: 'Label', validation: { isRequired: true } }),
          value: fields.text({ label: 'Value', validation: { isRequired: true } }),
        }),
        {
          label: 'Human details (About page, optional)',
          itemLabel: (p) => p.fields.label.value || 'Untitled',
        },
      ),
    },
  });

export const home = (locale: string) =>
  singleton({
    label: 'Home page',
    path: `${base(locale)}/home/`,
    format: { data: 'yaml' },
    schema: {
      hero: fields.object(
        {
          headline: fields.text({ label: 'Headline (H1)', validation: { isRequired: true } }),
          subline: fields.text({ label: 'Subline', multiline: true, validation: { isRequired: true } }),
        },
        { label: 'Hero' },
      ),
      services: fields.array(
        fields.object({
          title: fields.text({ label: 'Engagement', validation: { isRequired: true } }),
          forWho: fields.text({ label: 'Who it is for', multiline: true }),
          deliverables: textList('What you get', 'Deliverable'),
        }),
        { label: 'What I do', itemLabel: (p) => p.fields.title.value || 'Untitled' },
      ),
      designNote: fields.text({ label: 'Design line', description: 'e.g. Bring your designs, or I will design it.' }),
      process: fields.array(
        fields.object({
          title: fields.text({ label: 'Step', validation: { isRequired: true } }),
          text: fields.text({ label: 'Details', multiline: true }),
        }),
        { label: 'How we work (steps, in order)', itemLabel: (p) => p.fields.title.value || 'Untitled' },
      ),
      quoteProcess: fields.text({ label: 'How quotes work (no prices)', multiline: true }),
      faq: fields.array(
        fields.object({
          question: fields.text({ label: 'Question', validation: { isRequired: true } }),
          answer: fields.text({ label: 'Answer', multiline: true, validation: { isRequired: true } }),
        }),
        { label: 'FAQ', itemLabel: (p) => p.fields.question.value || 'Untitled' },
      ),
    },
  });

export const skills = (locale: string) =>
  singleton({
    label: 'Skills',
    path: `${base(locale)}/skills`,
    format: { data: 'yaml' },
    schema: {
      groups: fields.array(
        fields.object({
          name: fields.text({ label: 'Group', validation: { isRequired: true } }),
          items: textList('Skills', 'Skill'),
        }),
        { label: 'Skill groups (CV)', itemLabel: (p) => p.fields.name.value || 'Untitled' },
      ),
    },
  });

export const projects = (locale: string) =>
  collection({
    label: 'Projects',
    slugField: 'title',
    path: `${base(locale)}/projects/*/`,
    format: { data: 'yaml' },
    columns: ['year'],
    schema: {
      title: fields.slug({ name: { label: 'Title' } }),
      type: fields.conditional(
        fields.select({ label: 'Type', options: projectTypes, defaultValue: 'side' }),
        {
          client: fields.object({
            clientType: fields.text({
              label: 'Client description',
              description: 'Shown instead of the name under NDA, e.g. Fintech startup',
            }),
            country: fields.relationship({ label: 'Client country', collection: 'clients' }),
            nda: fields.checkbox({ label: 'Under NDA', description: 'Anonymize the client and blur data' }),
          }),
          side: fields.empty(),
          research: fields.object({
            status: fields.select({ label: 'Status', options: researchStatuses, defaultValue: 'ongoing' }),
            lab: fields.text({ label: 'Lab / institution' }),
            supervisor: fields.text({ label: 'Supervisor' }),
            paper: fields.url({ label: 'Paper URL' }),
            slides: fields.url({ label: 'Slides URL' }),
            poster: fields.url({ label: 'Poster URL' }),
          }),
        },
      ),
      outcome: fields.text({
        label: 'One-line outcome',
        description: 'Card subtitle and meta description',
        validation: { isRequired: true, length: { max: 160 } },
      }),
      year: fields.integer({ label: 'Year', validation: { min: 2010, max: 2100 } }),
      tags: fields.multiRelationship({ label: 'Tags', collection: `tags_${locale}` }),
      stack: textList('Stack', 'Technology'),
      role: fields.text({ label: 'Role' }),
      timeline: fields.text({ label: 'Timeline', description: 'e.g. 6 weeks' }),
      team: fields.text({ label: 'Team', description: 'e.g. Solo, or with a designer' }),
      metrics: fields.array(
        fields.object({
          value: fields.text({ label: 'Value', description: 'e.g. 1.2 s', validation: { isRequired: true } }),
          label: fields.text({ label: 'Label', validation: { isRequired: true } }),
          context: fields.text({ label: 'Context', description: 'e.g. mobile, 4G' }),
        }),
        {
          label: 'Results (2-3 metrics)',
          itemLabel: (p) => `${p.fields.value.value} ${p.fields.label.value}`,
          validation: { length: { max: 3 } },
        },
      ),
      heroImage: fields.image({ label: 'Hero image' }),
      heroAlt: fields.text({ label: 'Hero image alt text' }),
      gallery: fields.array(
        fields.object({
          image: fields.image({ label: 'Image', validation: { isRequired: true } }),
          alt: fields.text({ label: 'Alt text', validation: { isRequired: true } }),
          caption: fields.text({ label: 'Caption' }),
        }),
        { label: 'Gallery', itemLabel: (p) => p.fields.caption.value || p.fields.alt.value || 'Image' },
      ),
      links: fields.object(
        {
          live: fields.url({ label: 'Live site' }),
          code: fields.url({ label: 'Source code' }),
        },
        { label: 'Links' },
      ),
      featured: fields.checkbox({ label: 'Featured on home' }),
      order: fields.integer({ label: 'Order', description: 'Lower comes first', defaultValue: 0 }),
      draft: draft(true),
      problem: fields.markdoc({ label: 'Problem (research: Question)' }),
      approach: fields.markdoc({ label: 'Approach' }),
      result: fields.markdoc({ label: 'Result (research: Findings)' }),
    },
  });

export const posts = (locale: string) =>
  collection({
    label: 'Posts',
    slugField: 'title',
    path: `${base(locale)}/posts/*/`,
    format: { contentField: 'body' },
    entryLayout: 'content',
    columns: ['publishedAt'],
    schema: {
      title: fields.slug({ name: { label: 'Title' } }),
      type: fields.conditional(
        fields.select({ label: 'Type', options: postTypes, defaultValue: 'article' }),
        {
          article: fields.object({
            cover: fields.image({ label: 'Cover image' }),
            coverAlt: fields.text({ label: 'Cover alt text' }),
          }),
          note: fields.empty(),
        },
      ),
      description: fields.text({
        label: 'Description',
        description: 'Meta description and card text',
        multiline: true,
        validation: { isRequired: true, length: { max: 160 } },
      }),
      tags: fields.multiRelationship({ label: 'Tags', collection: `tags_${locale}` }),
      series: fields.text({ label: 'Series' }),
      seriesOrder: fields.integer({ label: 'Order in series', validation: { min: 1 } }),
      publishedAt: fields.date({
        label: 'Published',
        defaultValue: { kind: 'today' },
        validation: { isRequired: true },
      }),
      updatedAt: fields.date({ label: 'Updated' }),
      draft: draft(true),
      cta: fields.select({ label: 'End-of-post CTA', options: postCtas, defaultValue: 'auto' }),
      canonicalUrl: fields.url({ label: 'Canonical URL', description: 'Only if first published elsewhere' }),
      linkedinHook: fields.text({ label: 'LinkedIn hook', multiline: true }),
      body: fields.markdoc({ label: 'Body', extension: 'mdoc' }),
    },
  });

export const testimonials = (locale: string) =>
  collection({
    label: 'Testimonials',
    slugField: 'project',
    path: `${base(locale)}/testimonials/*`,
    format: { data: 'yaml' },
    columns: ['source', 'order'],
    schema: {
      project: fields.slug({
        name: {
          label: 'Project label',
          description: 'Our label for the job, e.g. React product page component',
        },
      }),
      quote: fields.text({
        label: 'Quote',
        description: 'Verbatim client words. Never reword; excerpt with … only.',
        multiline: true,
        validation: { isRequired: true },
      }),
      excerpt: fields.text({
        label: 'Short excerpt',
        description: 'Verbatim excerpt for tight spaces (home cards)',
        multiline: true,
      }),
      author: fields.text({ label: 'Author', defaultValue: 'Upwork client', validation: { isRequired: true } }),
      role: fields.text({ label: 'Author role' }),
      company: fields.text({ label: 'Company' }),
      country: fields.relationship({ label: 'Country', collection: 'clients' }),
      source: fields.select({ label: 'Source', options: testimonialSources, defaultValue: 'upwork' }),
      sourceUrl: fields.url({ label: 'Verification URL' }),
      rating: fields.number({ label: 'Rating', step: 0.1, validation: { min: 0, max: 5 } }),
      endorsement: fields.text({ label: 'Endorsement badge', description: 'As shown on Upwork, e.g. Committed to Quality' }),
      relatedProject: fields.relationship({ label: 'Related project', collection: `projects_${locale}` }),
      featured: fields.checkbox({ label: 'Featured on home' }),
      order: fields.integer({ label: 'Order', description: 'Lower comes first', defaultValue: 0 }),
    },
  });

export const experience = (locale: string) =>
  collection({
    label: 'Experience',
    slugField: 'title',
    path: `${base(locale)}/experience/*`,
    format: { data: 'yaml' },
    columns: ['company', 'start'],
    schema: {
      title: fields.slug({ name: { label: 'Role title' } }),
      company: fields.text({ label: 'Company', validation: { isRequired: true } }),
      location: fields.text({ label: 'Location', description: 'e.g. Remote, or Tunis, Tunisia' }),
      employment: fields.select({ label: 'Employment type', options: employmentTypes, defaultValue: 'full-time' }),
      start: fields.date({ label: 'Start', description: 'Required before publishing (shown on the CV)' }),
      end: fields.date({ label: 'End', description: 'Leave empty for Present' }),
      bullets: fields.array(fields.text({ label: 'Result', multiline: true, validation: { isRequired: true } }), {
        label: 'Results (3-4)',
        itemLabel: (p) => p.value,
        validation: { length: { max: 5 } },
      }),
      stack: textList('Stack', 'Technology'),
      draft: draft(),
    },
  });

export const education = (locale: string) =>
  collection({
    label: 'Education',
    slugField: 'degree',
    path: `${base(locale)}/education/*`,
    format: { data: 'yaml' },
    columns: ['school'],
    schema: {
      degree: fields.slug({ name: { label: 'Degree' } }),
      school: fields.text({ label: 'School', validation: { isRequired: true } }),
      location: fields.text({ label: 'Location' }),
      start: fields.date({ label: 'Start' }),
      end: fields.date({ label: 'End', description: 'Leave empty if in progress' }),
      details: fields.text({ label: 'Details', multiline: true }),
      research: fields.multiRelationship({ label: 'Research projects', collection: `projects_${locale}` }),
      draft: draft(),
    },
  });

export const tags = (locale: string) =>
  collection({
    label: 'Tags',
    slugField: 'label',
    path: `${base(locale)}/tags/*`,
    format: { data: 'yaml' },
    columns: ['pillar'],
    schema: {
      label: fields.slug({ name: { label: 'Label' } }),
      description: fields.text({ label: 'Intro', description: 'Shown on /tag/[tag]', multiline: true }),
      pillar: fields.checkbox({
        label: 'Pillar (topic hub)',
        description: 'Gets a hub intro and drives the end-of-post CTA',
      }),
    },
  });
