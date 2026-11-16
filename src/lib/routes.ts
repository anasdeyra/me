// Route registry for site navigation (header, mobile menu, footer, 404) and FR-22 content gating.
// A link renders in production only when its page is built (`built: true`) and its content gate passes.
// In `astro dev` every link renders, so the whole shell can be reviewed before the pages exist.
// When a page ships, set `built: true` here.
import { t, type Key } from '@/i18n';
import { getPosts, getProjects } from './content';

/** FR-22 thresholds: a section with fewer published entries looks abandoned, so it stays hidden. */
export const MIN_PROJECTS = 2;
export const MIN_POSTS = 3;

type Route = {
  href: string;
  label?: Key;
  built: boolean;
  gate?: () => Promise<boolean>;
};

let projectCount: Promise<number> | undefined;
let postCount: Promise<number> | undefined;
const enoughProjects = async () =>
  (await (projectCount ??= getProjects().then((p) => p.length))) >=
  MIN_PROJECTS;
const enoughPosts = async () =>
  (await (postCount ??= getPosts().then((p) => p.length))) >= MIN_POSTS;

export const routes = {
  home: { href: '/', built: true },
  work: {
    href: '/work',
    label: 'nav.work',
    built: false,
    gate: enoughProjects,
  },
  writing: {
    href: '/blog',
    label: 'nav.writing',
    built: false,
    gate: enoughPosts,
  },
  about: { href: '/about', label: 'nav.about', built: false },
  cv: { href: '/cv', label: 'nav.cv', built: false },
  privacy: { href: '/privacy', label: 'footer.privacy', built: false },
  rss: {
    href: '/rss.xml',
    label: 'footer.rss',
    built: false,
    gate: enoughPosts,
  },
} satisfies Record<string, Route>;

export type RouteKey = keyof typeof routes;

export type NavLink = {
  key: RouteKey;
  href: string;
  label: string;
  current: boolean;
};

/** Whether a route may be linked from this build. */
export async function isLive(key: RouteKey): Promise<boolean> {
  if (import.meta.env.DEV) return true;
  const route: Route = routes[key];
  return route.built && (route.gate ? await route.gate() : true);
}

/** `aria-current` match: the route itself or any page below it (/work/x marks Work). */
export function isCurrent(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return href === '/'
    ? path === '/'
    : path === href || path.startsWith(`${href}/`);
}

/** Live links for the given routes, in order, with labels and the current-page flag. */
export async function links(
  keys: RouteKey[],
  pathname: string,
): Promise<NavLink[]> {
  const live = await Promise.all(keys.map(isLive));
  return keys
    .filter((_, i) => live[i])
    .map((key) => {
      const route: Route = routes[key];
      return {
        key,
        href: route.href,
        label: route.label ? t(route.label) : route.href,
        current: isCurrent(route.href, pathname),
      };
    });
}

/** Main navigation (FR-1): Work · Writing · About · CV. */
export const mainNav = (pathname: string) =>
  links(['work', 'writing', 'about', 'cv'], pathname);
