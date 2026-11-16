export const en = {
  // <title>: home uses the full name (recruiters search it); other pages use the brand.
  'seo.homeTitle': '{name} | Full-stack engineer for startups',
  'seo.title': '{page} | {brand}',
  'seo.ogLocale': 'en_US',

  // Shell
  'a11y.skipToContent': 'Skip to content',
  'a11y.newTab': '(opens in a new tab)',
  'nav.label': 'Main',
  'nav.home': '{brand}, home',
  'nav.work': 'Work',
  'nav.writing': 'Writing',
  'nav.about': 'About',
  'nav.cv': 'CV',
  'menu.open': 'Menu',
  'menu.close': 'Close',
  'theme.dark': 'Dark theme',

  // Contact (reply times are promises: keep them true)
  'whatsapp.short': 'WhatsApp',
  'whatsapp.cta': 'Message me on WhatsApp',
  'whatsapp.prefill.default':
    "Hi Anas, I found you on deyra.dev. I'd like to talk about a project: ",
  'contact.linkedin': 'LinkedIn',
  'contact.upwork': 'Upwork',
  'contact.github': 'GitHub',

  // Footer
  'footer.cta.title': 'Tell me what you’re building.',
  'footer.cta.body':
    'Message me on WhatsApp: I usually reply within an hour. Prefer email? I reply within a day.',
  'footer.base':
    'Based in {city}, {country} ({offset}): full overlap with European working hours.',
  'footer.languages': 'I work in {languages}.',
  'footer.site': 'Site',
  'footer.contact': 'Contact',
  'footer.copyright': '© {year} {name}',
  'footer.privacy': 'Privacy',
  'footer.rss': 'RSS',

  // 404
  'notFound.title': 'Page not found',
  'notFound.description':
    'This page doesn’t exist. Go to the home page, or message me on WhatsApp.',
  'notFound.code': '404',
  'notFound.heading': 'This page doesn’t exist.',
  'notFound.body': 'The link may be broken, or the page has moved.',
  'notFound.home': 'Go to the home page',
  'notFound.help':
    'Looking for something specific? {whatsapp} or email {email}.',
} as const;
