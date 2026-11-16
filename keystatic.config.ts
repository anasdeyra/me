import { config, fields, singleton } from '@keystatic/core';

// Local storage only: content is edited in dev and committed via git.
export default config({
  storage: { kind: 'local' },
  singletons: {
    settings: singleton({
      label: 'Settings',
      path: 'src/content/settings',
      format: { data: 'json' },
      schema: {
        siteTitle: fields.text({ label: 'Site title' }),
      },
    }),
  },
});
