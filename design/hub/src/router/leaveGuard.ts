/**
 * Warns before the page is left with unsaved edits. Two ways out are covered:
 *  - closing or reloading the tab, through the browser's own prompt;
 *  - moving to another page inside the Hub (a link, or Back / Forward), through a confirm.
 *
 * `installLeaveGuard()` must run before React subscribes to `hashchange`. When the designer
 * declines, this listener stops the event, so the router never sees the move, then puts the
 * address back. The page, and the text in it, were never unmounted.
 */

export const LEAVE_MESSAGE = "You have unsaved changes. If you leave this page they will be lost.";

let dirty = false;
let lastHref = typeof window === "undefined" ? "" : window.location.href;
let installed = false;

/** Tell the guard whether there is something to lose. */
export function setUnsavedChanges(value: boolean): void {
  dirty = value;
}

export function hasUnsavedChanges(): boolean {
  return dirty;
}

export function installLeaveGuard(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  lastHref = window.location.href;

  window.addEventListener("beforeunload", (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = ""; // some browsers still need this to show their prompt
  });

  window.addEventListener("hashchange", (e) => {
    if (!dirty || window.confirm(LEAVE_MESSAGE)) {
      lastHref = window.location.href;
      return;
    }
    e.stopImmediatePropagation();
    // replaceState does not fire `hashchange`, so nothing else has to be told.
    window.history.replaceState(window.history.state, "", lastHref);
  });
}
