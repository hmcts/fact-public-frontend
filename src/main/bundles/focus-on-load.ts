// Moves keyboard/screen-reader focus to the results heading when a page reloads with new
// results (e.g. prefix search results), so assistive technology users are made aware that the
// content has changed even though the page title stays the same.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const target = document.querySelector<HTMLElement>('.js-focus-on-load');
    target?.focus();
  });
}
