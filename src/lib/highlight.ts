// Build-time code highlighting (D1). Shiki runs with a sentinel theme: every token colour is one of six
// near-black placeholders that we map to a CSS class (`tk-*`, styled with tokens in global.css), so the output
// has no inline styles (CSP) and follows the light/dark theme automatically. No WASM (JS regex engine).
import Markdoc from '@markdoc/markdoc';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { ThemeRegistration } from 'shiki/types';
import { t } from '@/i18n';

const sentinels = {
  '#010101': 'tk-kw',
  '#020202': 'tk-str',
  '#030303': 'tk-com',
  '#040404': 'tk-fn',
  '#050505': 'tk-num',
  '#060606': 'tk-pun',
} as const;
const FOREGROUND = '#070707';

const rule = (scope: string[], foreground: string, fontStyle?: string) => ({
  scope,
  settings: { foreground, ...(fontStyle ? { fontStyle } : {}) },
});

const theme: ThemeRegistration = {
  name: 'sentinel',
  type: 'light',
  fg: FOREGROUND,
  bg: '#ffffff',
  settings: [
    rule(['comment', 'punctuation.definition.comment'], '#030303', 'italic'),
    rule(
      ['string', 'punctuation.definition.string', 'markup.inserted'],
      '#020202',
    ),
    rule(
      [
        'keyword',
        'storage',
        'entity.name.tag',
        'markup.deleted',
        'keyword.control',
      ],
      '#010101',
      'bold',
    ),
    rule(
      [
        'entity.name.function',
        'support.function',
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.attribute-name',
        'meta.object-literal.key',
      ],
      '#040404',
    ),
    rule(['constant', 'variable.other.constant', 'markup.heading'], '#050505'),
    rule(
      [
        'punctuation',
        'meta.brace',
        'keyword.operator',
        'meta.separator',
        'punctuation.separator',
      ],
      '#060606',
    ),
  ],
};

// Languages imported one by one: only what the posts need ends up in the build.
const languages = [
  import('shiki/langs/typescript.mjs'),
  import('shiki/langs/tsx.mjs'),
  import('shiki/langs/javascript.mjs'),
  import('shiki/langs/json.mjs'),
  import('shiki/langs/bash.mjs'),
  import('shiki/langs/css.mjs'),
  import('shiki/langs/html.mjs'),
  import('shiki/langs/yaml.mjs'),
  import('shiki/langs/diff.mjs'),
  import('shiki/langs/markdown.mjs'),
];

let highlighter: Promise<HighlighterCore> | undefined;

/** One shared highlighter per build. */
export function getHighlighter(): Promise<HighlighterCore> {
  return (highlighter ??= createHighlighterCore({
    themes: [theme],
    langs: languages,
    engine: createJavaScriptRegexEngine(),
  }));
}

const aliases: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

type Child = RenderableTreeNode;

function codeBlock(
  language: string | undefined,
  children: Child[],
): RenderableTreeNode {
  return new Markdoc.Tag(
    'pre',
    {
      class: 'code-block',
      tabindex: '0',
      role: 'region',
      'aria-label': t('blog.code.label'),
      ...(language ? { 'data-language': language } : {}),
    },
    [new Markdoc.Tag('code', {}, children)],
  );
}

/**
 * A fenced code block to `<pre><code>` with `<span class="tk-*">` tokens. Unknown or missing language: plain
 * escaped text (the Markdoc HTML renderer escapes text nodes).
 */
export function highlightCode(
  hl: HighlighterCore,
  code: string,
  language?: string,
): RenderableTreeNode {
  const source = code.replace(/\n$/, '');
  const raw = language?.toLowerCase();
  const lang = raw ? (aliases[raw] ?? raw) : undefined;
  if (!lang || !hl.getLoadedLanguages().includes(lang)) {
    return codeBlock(undefined, [source]);
  }
  const { tokens } = hl.codeToTokens(source, { lang, theme: 'sentinel' });
  const children: Child[] = [];
  tokens.forEach((line, i) => {
    if (i > 0) children.push('\n');
    for (const token of line) {
      const color = token.color?.toLowerCase() as
        keyof typeof sentinels | undefined;
      const cls = color ? sentinels[color] : undefined;
      children.push(
        cls
          ? new Markdoc.Tag('span', { class: cls }, [token.content])
          : token.content,
      );
    }
  });
  return codeBlock(lang, children);
}
