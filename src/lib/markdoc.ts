// Renders Keystatic markdoc fields to HTML at build time. @astrojs/markdoc is dev-only (see AGENTS.md),
// so production pages use this shared renderer and output the string with `set:html`.
// Content comes from the repo, so injecting the HTML is safe. Style it with the `.prose-site` wrapper.
import Markdoc, {
  type Config,
  type Node,
  type RenderableTreeNode,
} from '@markdoc/markdoc';
import type { HighlighterCore } from 'shiki/core';
import { getHighlighter, highlightCode } from './highlight';

// `node` is typed loosely: Keystatic bundles its own @markdoc/markdoc copy, whose Node type is nominally different.
type MarkdocValue = { node: unknown };
// `getProfile()` reads with resolveLinkedFiles (value), a plain reader read returns a lazy function.
type MarkdocField =
  MarkdocValue | (() => Promise<MarkdocValue>) | undefined | null;

const linkNode = {
  ...Markdoc.nodes.link,
  transform(node: Node, cfg: Config) {
    const attributes = node.transformAttributes(cfg);
    const external = /^https?:\/\//.test(String(attributes.href ?? ''));
    return new Markdoc.Tag(
      'a',
      {
        ...attributes,
        ...(external ? { rel: 'noopener noreferrer' } : {}),
        class: 'link',
      },
      node.transformChildren(cfg),
    );
  },
};

// Shared by `renderMarkdoc` (links only, as before) and `renderPost` (adds code highlighting and heading ids).
const config: Config = { nodes: { link: linkNode } };

async function resolveNode(field: MarkdocField): Promise<Node | undefined> {
  if (!field) return undefined;
  const { node } = typeof field === 'function' ? await field() : field;
  return node as Node;
}

function toHtml(tree: RenderableTreeNode): string {
  // Render the children: Markdoc wraps documents in <article>, which `.prose-site` already is.
  return Markdoc.renderers.html(
    typeof tree === 'object' && tree && 'children' in tree
      ? tree.children
      : tree,
  );
}

/**
 * A reader markdoc field (`profile.longBio`, `project.problem`, `post.body`; lazy or already resolved)
 * to an HTML string.
 */
export async function renderMarkdoc(field: MarkdocField): Promise<string> {
  const node = await resolveNode(field);
  if (!node) return '';
  return toHtml(Markdoc.transform(node, config) as RenderableTreeNode);
}

export interface PostHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface RenderedPost {
  html: string;
  headings: PostHeading[];
  /** Words in prose and inline code (fenced code excluded). */
  words: number;
}

const RESERVED_IDS = new Set([
  'main',
  'toc',
  'post-cta',
  'related-title',
  'site-menu',
  'footer-site-title',
  'search-title',
  'search-input',
  'blog-title',
  'tag-title',
]);

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';

const nodeText = (node: Node): string => {
  let out = '';
  for (const n of node.walk()) {
    if (n.type === 'text' || n.type === 'code')
      out += String(n.attributes.content ?? '');
  }
  return out;
};

/**
 * A post body to HTML with highlighted code, ids on H2/H3 headings (unique per call), the heading list for the
 * table of contents, and a word count for reading time (D2). Per-call state only.
 */
export async function renderPost(field: MarkdocField): Promise<RenderedPost> {
  const node = await resolveNode(field);
  if (!node) return { html: '', headings: [], words: 0 };

  const queue: string[] = [];
  let next = 0;
  const headings: PostHeading[] = [];
  const used = new Set(RESERVED_IDS);
  let words = 0;
  let hasFence = false;
  const walk = (n: Node, inFence: boolean) => {
    if (n.type === 'fence') hasFence = true;
    if (n.type === 'heading') {
      const level = Number(n.attributes.level);
      if (level !== 2 && level !== 3) queue.push('');
      if (level === 2 || level === 3) {
        const text = nodeText(n).trim();
        const base = slugify(text);
        let id = base;
        for (let k = 2; used.has(id); k++) id = `${base}-${k}`;
        used.add(id);
        queue.push(id);
        headings.push({ id, text, level });
      }
    }
    if (!inFence && (n.type === 'text' || n.type === 'code')) {
      words += (String(n.attributes.content ?? '').match(/\S+/g) ?? []).length;
    }
    for (const child of n.children) walk(child, inFence || n.type === 'fence');
  };
  walk(node, false);

  const hl: HighlighterCore | undefined = hasFence
    ? await getHighlighter()
    : undefined;
  const postConfig: Config = {
    nodes: {
      link: linkNode,
      heading: {
        ...Markdoc.nodes.heading,
        transform(n: Node, cfg: Config) {
          const { level: _level, ...attributes } = n.transformAttributes(cfg);
          const level = n.attributes.level;
          // Identity lookups miss (Keystatic's Node copy), but both passes visit headings in document order.
          const id = queue[next++];
          return new Markdoc.Tag(
            `h${level}`,
            { ...attributes, ...(id ? { id } : {}) },
            n.transformChildren(cfg),
          );
        },
      },
      fence: {
        ...Markdoc.nodes.fence,
        transform(n: Node) {
          return hl
            ? highlightCode(
                hl,
                String(n.attributes.content ?? ''),
                n.attributes.language as string | undefined,
              )
            : '';
        },
      },
    },
  };
  return {
    html: toHtml(Markdoc.transform(node, postConfig) as RenderableTreeNode),
    headings,
    words,
  };
}
