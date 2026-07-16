# Unified Keyword Search Design

## Goal

Restore the site's keyword search and make it search all published content under both `/docs` and `/blog`. Queries must match article titles, descriptions, headings, and body text. English keywords such as `Java` and `WordPress`, as well as partial Chinese titles such as `多数据源`, must return navigable results.

The search remains a local keyword search. It does not call `/api/chat` or an external language model.

## Current Failure

The current Fumadocs advanced index uses each page URL as its internal document ID. It generates child document IDs by appending `-0`, `-1`, and so on. Therefore the child ID generated for:

`/docs/languages/java/spring-boot/spring-boot-multiple-datasource`

can collide with the real page ID:

`/docs/languages/java/spring-boot/spring-boot-multiple-datasource-2`

Orama rejects the index with `DOCUMENT_ALREADY_EXISTS`, `/api/search` returns HTTP 500, and the search dialog displays no results. URL-level page deduplication cannot prevent this collision because the two source page URLs are distinct.

The existing English tokenizer also does not reliably match a partial Chinese title contained inside a longer unsegmented title.

## Recommended Architecture

Keep the existing Fumadocs search dialog and `/api/search` endpoint, but replace the current source-to-index adapter with a unified search index builder.

The builder has three responsibilities:

1. Convert every Fumadocs document page into a common search-page shape.
2. Convert every blog collection entry into the same shape and use `/blog/<slug>` as its result URL.
3. Assign every page a fixed-length deterministic hash ID derived from its canonical URL.

Fixed-length page IDs cannot collide with Fumadocs child IDs because child IDs always contain an additional numeric suffix. Result URLs remain unchanged and continue pointing to the original document or blog article.

## Indexed Fields

Each source item contributes:

- Page title as a page result.
- Description or excerpt as searchable text.
- Structured headings as heading results with anchors when available.
- Structured body contents as text results.

Title results receive the natural page-level ranking supplied by the advanced search format. Search result items keep their `page`, `heading`, or `text` type so the existing dialog can render them without a UI rewrite.

## Chinese and English Matching

The primary index continues to provide ranked full-text search for English words and ordinary tokens. A language-neutral substring fallback supplements it for partial Chinese queries and other terms that the tokenizer cannot split.

For each request:

1. Normalize the query by trimming whitespace and applying case-insensitive comparison for Latin text.
2. Run the ranked primary search.
3. Find title, heading, description, and body strings containing the normalized query.
4. Merge fallback matches with primary matches by URL and content identity.
5. Rank title matches ahead of heading and body matches, then apply the endpoint result limit.

This preserves ranked keyword behavior while making partial Chinese titles predictable.

## Data Flow

`content/docs` and `content/blog` feed a cached server-side index. The default Fumadocs search client sends `GET /api/search?query=<term>`. The endpoint searches the cached index, merges substring fallback results, and returns the standard Fumadocs search-result array. Selecting a result navigates directly to its `/docs/...` or `/blog/...` URL.

The cache is scoped to the route module. Development restarts or hot reloads rebuild it from generated collections. Production builds initialize it on first search request.

## Error Handling

- Empty or whitespace-only queries return an empty array.
- Invalid collection records are skipped only when they lack a usable title or URL; valid records continue to be indexed.
- Internal IDs are generated centrally and checked for uniqueness before Orama receives them.
- Index initialization failures remain HTTP 500 errors and are logged with their original cause rather than being presented as an empty successful result.

## Testing

Automated tests will verify:

- The historical `spring-boot-multiple-datasource` and `spring-boot-multiple-datasource-2` collision builds successfully.
- `Java` matches a document title or body keyword.
- `WordPress` matches the existing WordPress document.
- A partial Chinese title such as `多数据源` returns the corresponding article.
- A keyword found only in body text returns a text result.
- A blog title and a blog body keyword both return a `/blog/...` result.
- Duplicate matches from primary and fallback search are merged.
- Empty queries return no results.

Verification also includes TypeScript checking and a live request to `/api/search` against the development server.

## Scope

This change covers local keyword search only. It does not add semantic embeddings, AI-generated answers, external search services, search analytics, or changes to the search dialog's visual design.
