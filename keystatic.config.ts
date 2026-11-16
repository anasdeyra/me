import { config } from '@keystatic/core';
import { clients, settings } from './src/keystatic/shared';
import {
  education,
  experience,
  home,
  posts,
  profile,
  projects,
  skills,
  tags,
  testimonials,
} from './src/keystatic/locale';

// Local storage only: content is edited in dev and committed via git.
// Language-neutral data lives in src/content/shared; translatable content in src/content/<locale>.
// Keys carry the locale suffix so adding FR is additive (e.g. `projects_fr: projects('fr')`).
export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'Deyra' },
    navigation: {
      Site: ['settings', 'clients'],
      'Pages (EN)': ['profile_en', 'home_en', 'skills_en'],
      'Content (EN)': ['projects_en', 'posts_en', 'tags_en'],
      'Proof and CV (EN)': ['testimonials_en', 'experience_en', 'education_en'],
    },
  },
  singletons: {
    settings,
    profile_en: profile('en'),
    home_en: home('en'),
    skills_en: skills('en'),
  },
  collections: {
    clients,
    projects_en: projects('en'),
    posts_en: posts('en'),
    testimonials_en: testimonials('en'),
    experience_en: experience('en'),
    education_en: education('en'),
    tags_en: tags('en'),
  },
});
