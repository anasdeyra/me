// Minimal types for the Pagefind browser API (https://pagefind.app/docs/api/), loaded at runtime from /pagefind/pagefind.js.
export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string } & Record<string, string | undefined>;
}

export interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

export interface PagefindResponse {
  results: PagefindResult[];
}

export interface Pagefind {
  init: () => Promise<void>;
  /** Resolves to `null` when a newer call superseded this one. */
  debouncedSearch: (
    term: string,
    options?: Record<string, unknown>,
    debounceMs?: number,
  ) => Promise<PagefindResponse | null>;
}
