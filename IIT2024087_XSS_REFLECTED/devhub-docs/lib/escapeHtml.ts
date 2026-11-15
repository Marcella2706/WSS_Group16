/**
 * Context-aware output encoding for HTML text content.
 *
 * This is the mitigation implemented for the Reflected XSS assignment
 * variant: every HTML-significant character in untrusted input is turned
 * into its harmless entity equivalent BEFORE the string is ever placed into
 * the page's HTML. The browser then renders it as inert text instead of
 * parsing it as markup/script, no matter what the attacker puts in `q`.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
