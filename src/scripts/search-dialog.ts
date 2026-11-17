// Lazy chunk: wires the search dialog to Pagefind. Imported by Search.astro on first open; Pagefind itself
// (JS, WebAssembly, index) loads from /pagefind/* only when this runs.
import { setShortcutsEnabled, shortcutsEnabled } from '@/scripts/shortcuts';
import type { Pagefind, PagefindResultData } from '@/types/pagefind';

const MAX_RESULTS = 8;
const PAGEFIND_URL = '/pagefind/pagefind.js';

/** Clean URL: no index.html, no .html, no trailing slash (the site uses trailingSlash: never). */
export function cleanUrl(url: string): string {
  const path = url
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.)\/$/, '$1');
  return path || '/';
}

export function initSearch(dialog: HTMLDialogElement): void {
  const q = <T extends HTMLElement>(sel: string) =>
    dialog.querySelector<T>(sel)!;
  const input = q<HTMLInputElement>('[data-search-input]');
  const status = q('[data-search-status]');
  const list = q<HTMLUListElement>('[data-search-results]');
  const none = q('[data-search-none]');
  const toggle = q<HTMLInputElement>('[data-shortcuts-toggle]');
  toggle.checked = shortcutsEnabled();
  toggle.addEventListener('change', () => setShortcutsEnabled(toggle.checked));
  const msg = (key: string) => dialog.dataset[key] ?? '';

  let pagefind: Promise<Pagefind> | undefined;
  const load = () =>
    (pagefind ??= (async () => {
      const url = PAGEFIND_URL;
      const pf: Pagefind = await import(/* @vite-ignore */ url);
      await pf.init();
      return pf;
    })());

  const clear = () => {
    list.replaceChildren();
    none.hidden = true;
  };

  const render = (items: PagefindResultData[]) => {
    list.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = cleanUrl(item.url);
        a.className = 'search-result';
        const title = document.createElement('span');
        title.className = 'search-result-title';
        title.textContent = item.meta.title ?? a.pathname;
        const excerpt = document.createElement('span');
        excerpt.className = 'search-result-excerpt';
        // Pagefind excerpts are our own page text with <mark> around the matches.
        excerpt.innerHTML = item.excerpt;
        a.append(title, excerpt);
        li.append(a);
        return li;
      }),
    );
    none.hidden = items.length > 0;
    status.textContent = items.length
      ? items.length === 1
        ? msg('one')
        : msg('many').replace('{n}', String(items.length))
      : msg('none');
  };

  let run = 0;
  const search = async () => {
    const term = input.value.trim();
    const id = ++run;
    if (!term) {
      clear();
      status.textContent = '';
      return;
    }
    status.textContent = msg('loading');
    try {
      const pf = await load();
      const response = await pf.debouncedSearch(term, {}, 200);
      if (!response || id !== run) return;
      const items = await Promise.all(
        response.results.slice(0, MAX_RESULTS).map((r) => r.data()),
      );
      if (id === run) render(items);
    } catch {
      if (id !== run) return;
      clear();
      status.textContent = msg(import.meta.env.DEV ? 'unavailable' : 'error');
    }
  };

  input.addEventListener('input', search);
  // type="search" swallows the first ESC to clear its text; ESC should always close.
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dialog.close();
    }
  });
  // Click on the backdrop (the dialog element itself; the panel fills the content box) closes.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    run++;
    input.value = '';
    clear();
    status.textContent = '';
  });
  // Warm the index while the user starts typing.
  void load().catch(() => {});
  if (input.value) void search();
}
