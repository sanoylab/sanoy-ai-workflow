---
paths:
  - "**/*.cshtml"
  - "**/wwwroot/**"
---
# Frontend rules: Razor views, CSS, JS (example)

Rename this file to `frontend.md` and replace the bullets with your project's real rules, each pointing at a path that shows the pattern. Delete what does not apply.

## Views
- Layout and shared partials live in `<Views/Shared path>`; a new page copies `<a small existing view>`.
- Never return domain entities to views; use view models from `<path>`.
- Forms carry the antiforgery token; POST actions have `[ValidateAntiForgeryToken]`.

## Dark mode (if the app has one)
- Dark overrides live inside the view's `@section Styles` block, targeting the specific card or panel class, so they beat inline styles.
- Use CSS variables (`var(--bg-surface)`, `var(--border-default)`) instead of hex colours in module CSS.
- Rich-text editor output carries inline colours; add `.dark-mode .<content-class> * { background-color: transparent !important; color: inherit !important; }`.

## Shared CSS and JS (don't reinvent)
- `<wwwroot/css/...>`: design tokens and global typography, loaded everywhere.
- `<wwwroot/js/main.js>`: modals, sidebar, table sort, pagination helpers.
- If you paste the same `<style>` block into more than two views, extract it to a shared file.

## Icons and analyzers
- If a static analyzer flags `<i>` or `<b>` tags, use the project's icon tag helper or `<em>` / `<strong>` and keep the guard test green.
